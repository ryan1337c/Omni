import supabase from "./supabaseClient";

export class PublicServices {
  async fetchHistory(id) {
    const { data, error } = await supabase
      .from("history")
      .select("chat_id, created_at, chat_title")
      .eq("id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  }

  async updateChatTitle(id, chatId, newTitle) {
    if (!chatId) {
      throw new Error("A chatId is required to update chat title.");
    }

    const { error } = await supabase
      .from("history")
      .update({ chat_title: newTitle })
      .eq("id", id)
      .eq("chat_id", chatId);

    if (error) throw error;
  }

  async addHistory(user_id, history) {
    // Generate chat id
    const chatId = crypto.randomUUID();

    const initialTitle = history.chat_title;

    const { data, error } = await supabase
      .from("history")
      .insert({
        id: user_id,
        chat_id: chatId,
        chat_title: initialTitle,
      })
      .select("chat_id, created_at, chat_title")
      .single();

    if (error) throw error;

    return data;
  }

  async deleteHistory(chat_id) {
    try {
      // Fetch all image storage paths (Public image bucket path) BEFORE CASCADE deletes them
      const { data: messages, error: fetchError } = await supabase
        .from("messages")
        .select(
          `
        *,
        storagePaths:images!message_id (
          storage_path
        )
      `,
        )
        .eq("chat_parent_id", chat_id);

      if (fetchError) throw fetchError;

      // Extract all image storage paths
      const allImagePaths = messages
        .filter((msg) => msg.storagePaths && msg.storagePaths.length > 0)
        .flatMap((msg) => msg.storagePaths.map((path) => path.storage_path));

      // Delete actual files from storage bucket
      if (allImagePaths.length > 0) {
        const deleteResults = await Promise.allSettled(
          allImagePaths.map(async (storagePath) => {
            // const filePath = imageUrl
            //   .replace(
            //     "https://wpaysatiyftwgaoeubjh.supabase.co/storage/v1/object/public/images/",
            //     "",
            //   )
            //   .trim();

            console.log(`Deleting file: ${storagePath}`);

            const { data, error } = await supabase.storage
              .from("images")
              .remove([storagePath]);

            if (error) {
              console.error(`Failed to delete ${storagePath}:`, error);
              throw error; // Let Promise.allSettled catch this
            }

            return storagePath;
          }),
        );

        // Log results
        const succeeded = deleteResults.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = deleteResults.filter(
          (r) => r.status === "rejected",
        ).length;
        console.log(
          `Storage deletion: ${succeeded} succeeded, ${failed} failed`,
        );
      }

      // 4. Delete the chat from history table
      // This will CASCADE delete messages, which will CASCADE delete images records
      const { data, error } = await supabase
        .from("history")
        .delete()
        .eq("chat_id", chat_id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error in deleteHistory:", error);
      throw error;
    }
  }

  async fetchMessages(chat_id) {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        imagesData:images!message_id (
          id,
          url,
          storage_path,
          orderIndex
        )
      `,
      )
      .eq("chat_parent_id", chat_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Normalize DB image rows to the MessageImage shape the UI expects
    return await Promise.all(
      (data ?? []).map(async (msg) => {
        // Use Promise.all on the inner map (images)
        const resolvedImages = await Promise.all(
          (msg.imagesData ?? []).map(async (img) => {
            let publicUrl = img.url ?? null;

            if (img.storage_path) {
              const { data: signedData, error: signedError } =
                await supabase.storage
                  .from("images")
                  .createSignedUrl(img.storage_path, 60 * 60);

              if (signedError) throw signedError;
              publicUrl = signedData.signedUrl ?? null;
            }

            return {
              id: img.id,
              public_url: publicUrl,
              storage_path: img.storage_path,
              order_index: img.orderIndex,
            };
          }),
        );

        return {
          ...msg,
          imagesData: resolvedImages,
        };
      }),
    );
  }

  async addMessages(chat_id, messages) {
    console.log("Add Message Start");
    // Insert all messages at once
    const messageRecords = messages.map((msg) => ({
      chat_parent_id: chat_id,
      content: msg.content,
      role: msg.role,
      loading: msg.loading,
      isNew: msg.isNew,
    }));

    console.log(
      "Payload being sent to Supabase messages table:",
      JSON.stringify(messageRecords, null, 2),
    );

    // Insert the message
    const { data: insertedMessages, error: msgError } = await supabase
      .from("messages")
      .insert(messageRecords)
      .select();

    console.log(
      "Supabase response - data:",
      insertedMessages,
      "error:",
      msgError,
    );

    if (msgError) {
      console.error("❌ Message Insert Error:", msgError);
      throw msgError;
    }

    if (!insertedMessages || insertedMessages.length === 0) {
      console.error(
        "⚠️ CRITICAL: Supabase returned empty data, meaning the row was rejected or unreadable due to RLS/policies.",
      );
    }

    // Insert all images for all messages
    const allImageRecords = [];

    messages.forEach((msg, msgIndex) => {
      if (msg.imagesData.length > 0) {
        const messageId = insertedMessages[msgIndex].id;
        msg.imagesData.forEach((img) => {
          allImageRecords.push({
            message_id: messageId,
            url: img.public_url,
            storage_path: img.storage_path,
            orderIndex: img.order_index,
          });
        });
      }
    });

    // Bulk insert all images if any
    if (allImageRecords.length > 0) {
      const { error: imgError } = await supabase
        .from("images")
        .insert(allImageRecords);

      if (imgError) {
        // Rollback: delete all messages if images fail
        const messageIds = insertedMessages.map((m) => m.id);
        await supabase.from("messages").delete().in("id", messageIds);
        throw imgError;
      }
    }
  }

  async uploadImages(imageUrls) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error("No active session");
    }

    // Upload all images in parallel
    const uploadPromises = imageUrls.map(async (imageUrl) => {
      const isLocalOrData =
        imageUrl.startsWith("blob:") || imageUrl.startsWith("data:");

      const fetchUrl = isLocalOrData
        ? imageUrl
        : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

      // Fetch the image. For local or data URLs, we don't need to proxy
      const imageResponse = await fetch(
        fetchUrl,
        isLocalOrData
          ? undefined
          : {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
      );

      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image");
      }

      // Get the image as a blob
      const blob = await imageResponse.blob();

      // Upload to supabase storage
      const fileName = `dalle/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, blob, {
          contentType: "image/png",
        });

      if (uploadError) {
        console.error("Upload error", uploadError);
        throw uploadError;
      }

      // Get the private URL of the image
      const { data: urlData, error: urlError } = await supabase.storage
        .from("images")
        .createSignedUrl(uploadData.path, 60 * 60); // 1 hour

      if (urlError) throw urlError;

      return {
        storagePath: uploadData.path,
        publicUrl: urlData.signedUrl,
      };
    });

    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  }

  async createQuiz(title, id, mode, duration, count, description, questions) {
    // Add to quizzes table
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: id,
        title: title,
        mode: mode,
        duration: duration,
        count: count,
        description: description,
      })
      .select("id, title, mode, duration, count, description, created_at")
      .single();

    if (quizError) {
      throw quizError;
    }

    // Add to questions table
    const questionRows = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: "mcq",
    }));

    const { data: insertQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows)
      .select("id");

    if (questionsError) {
      throw questionsError;
    }

    // Add to choices table
    let choiceRows = [];
    questions.forEach((q, index) => {
      // Fetch current question id
      const questionId = insertQuestions[index].id;

      const correct_index = q.correct_index;

      q.choices.forEach((choice, index) => {
        choiceRows.push({
          question_id: questionId,
          choice_text: choice,
          is_correct: index === correct_index,
        });
      });
    });

    const { error: choicesError } = await supabase
      .from("choices")
      .insert(choiceRows);

    if (choicesError) {
      throw choicesError;
    }

    return quiz;
  }

  async getQuizzes(userId) {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, mode, duration, count, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }); // most recent first

    if (error) throw error;

    return data;
  }

  async getQuizQuestions(quizId) {
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id, question_text, question_type, correct_answer")
      .eq("quiz_id", quizId);

    if (questionsError) throw questionsError;

    const questionIds = questionsData.map((q) => q.id);

    // Fetch all choices at once
    const { data: choicesData, error: choicesError } = await supabase
      .from("choices")
      .select("question_id, choice_text, is_correct")
      .in("question_id", questionIds);

    if (choicesError) throw choicesError;

    const choicesMap = choicesData.reduce((map, choice) => {
      if (!map.has(choice.question_id)) {
        map.set(choice.question_id, []);
      }
      map.get(choice.question_id).push(choice);
      return map;
    }, new Map());

    // Merge them together
    const questionsWithChoices = questionsData.map((q) => ({
      ...q,
      choices: choicesMap.get(q.id) || [],
    }));

    return questionsWithChoices;
  }

  async deleteQuiz(userId, quizId) {
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("user_id", userId)
      .eq("id", quizId);

    if (error) throw error;
  }

  async updateQuiz(quizId, title, description, duration, questions) {
    // Update the Quiz Metadata
    const { data: updatedQuiz, error: quizError } = await supabase
      .from("quizzes")
      .update({
        title: title,
        description: description,
        duration: duration,
        count: questions.length,
      })
      .eq("id", quizId)
      .select("id, title, mode, duration, count, description, created_at")
      .single();

    if (quizError) throw quizError;

    // Delete existing questions for this quiz
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);

    if (deleteError) throw deleteError;

    // Insert the new Questions
    const questionRows = questions.map((q) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      question_type: "mcq",
    }));

    const { data: insertQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows)
      .select("id");

    if (questionsError) throw questionsError;

    // Insert the new Choices
    let choiceRows = [];

    questions.forEach((q, index) => {
      const questionId = insertQuestions[index].id;
      const correct_index = q.correct_index;

      q.choices.forEach((choiceText, cIndex) => {
        choiceRows.push({
          question_id: questionId,
          choice_text: choiceText,
          is_correct: cIndex === correct_index,
        });
      });
    });

    if (choiceRows.length > 0) {
      const { error: choicesError } = await supabase
        .from("choices")
        .insert(choiceRows);

      if (choicesError) throw choicesError;
    }

    return updatedQuiz;
  }

  /**
   * Fetches folders/decks for a user
   * @param {string} userId
   * @param {number|null} id
   * @returns {Promise<Array>}
   */
  async getFlashcardFolder(userId, id = null) {
    // Construct the Folder Query
    let folderQuery = supabase
      .from("flashcards_folders")
      .select(
        "id, created_at, title, count, depth, isStarred, parent_id, last_updated",
      )
      .eq("user_id", userId);

    // Construct the Flashcards Query
    let deckQuery = supabase
      .from("decks")
      .select(
        "id, created_at, title, isStarred, count, parent_id, last_updated, mode, description",
      )
      .eq("user_id", userId);

    // Apply correct filter logic for parent_id
    if (id === null) {
      folderQuery = folderQuery.is("parent_id", null);
      deckQuery = deckQuery.is("parent_id", null);
    } else {
      folderQuery = folderQuery.eq("parent_id", id);
      deckQuery = deckQuery.eq("parent_id", id);
    }

    // Run both queries in parallel for better performance
    const [folderRes, deckRes] = await Promise.all([folderQuery, deckQuery]);

    if (folderRes.error) throw folderRes.error;
    if (deckRes.error) throw deckRes.error;

    const subFolders = folderRes.data;
    const decks = deckRes.data;

    // Merge datasets
    const data = [
      ...(subFolders || []).map((folder) => ({
        ...folder,
        type: "folder",
      })),
      ...(decks || []).map((card) => ({
        ...card,
        type: "deck",
        depth: 0,
      })),
    ];

    // Sort data by newest first (created_at)
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return data;
  }

  async createFolder(user_id, folderData, parentId) {
    const { data, error } = await supabase
      .from("flashcards_folders")
      .insert({
        user_id: user_id,
        title: folderData.title,
        count: folderData.count,
        depth: folderData.depth,
        isStarred: folderData.isStarred || false,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async createDeck(userId, parentId, title, description, mode, cards) {
    // insert into deck table
    const { data: deckData, error: deckError } = await supabase
      .from("decks")
      .insert({
        user_id: userId,
        title: title,
        parent_id: parentId,
        description: description,
        mode: mode,
      })
      .select()
      .single();

    if (deckError) throw deckError;

    // insert into flashcards
    const flashcardsToInsert = cards.map((card) => ({
      user_id: userId,
      prompt: card.front,
      answer: card.back,
      parent_id: deckData.id,
    }));

    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, parent_id, prompt, answer");

    if (flashcardsError) throw flashcardsError;

    return {
      deck: deckData,
      flashcards: flashcardsData,
    };
  }

  // Updates folders or decks. Individual flashcards not included
  async updateFlashcardItems(userId, itemId, updates) {
    const tableName =
      updates.itemType === "folder" ? "flashcards_folders" : "decks";

    // Transform camelCase to snake_case for database
    const dbUpdates = {};

    // Common fields for both folders and flashcards
    if (updates.isStarred !== undefined)
      dbUpdates.isStarred = updates.isStarred;
    if (updates.title !== undefined)
      dbUpdates.title = updates.title || "No Title";
    if (updates.count !== undefined) dbUpdates.count = updates.count;
    if (updates.depth !== undefined) dbUpdates.depth = updates.depth;
    if (updates.parent_id !== undefined)
      dbUpdates.parent_id = updates.parent_id;

    const { error } = await supabase
      .from(tableName)
      .update(dbUpdates)
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  async updateFlashcards(
    userId,
    deckId,
    title,
    description,
    cards,
    deletedCardIds,
  ) {
    // Delete
    if (deletedCardIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("flashcards")
        .delete()
        .in("id", deletedCardIds)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;
    }

    const promises = [
      // Always update deck (it's cheap)
      supabase
        .from("decks")
        .update({
          title: title || "No Title",
          description: description || null,
        })
        .eq("id", deckId)
        .eq("user_id", userId)
        .select()
        .single(),
    ];

    // Only update cards if there are modified cards
    if (cards.length > 0) {
      promises.push(
        supabase
          .from("flashcards")
          .upsert(
            cards.map((card) => ({
              ...(typeof card.id === "number" && { id: card.id }),
              user_id: userId,
              parent_id: deckId,
              prompt: card.front,
              answer: card.back,
            })),
            { onConflict: "id" },
          )
          .select()
          .order("id", { ascending: true }),
      );
    }

    const results = await Promise.all(promises);

    // Extract results
    const [deckResult, cardsResult] = results;

    // Check for errors
    if (deckResult.error) {
      throw new Error(deckResult.error.message || "Failed to update deck");
    }

    if (cardsResult?.error) {
      throw new Error(cardsResult.error.message || "Failed to save flashcards");
    }

    // Return combined data
    return deckResult.data;
  }

  async getFlashcards(deckId) {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, parent_id, prompt, answer")
      .eq("parent_id", deckId)
      .order("id", { ascending: true });

    if (error) throw error;

    return data;
  }

  async deleteFlashcardItem(userId, itemId, type) {
    const tableName = type === "folder" ? "flashcards_folders" : "decks";

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  async getSubscription(userId) {
    const { data, error } = await supabase
      .from("user_entitlements")
      .select("tier")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data.tier;
  }

  async getBillingSummary(userId) {
    const { data: entitlement, error: entitlementError } = await supabase
      .from("user_entitlements")
      .select("tier, tier_expires_at, source_subscription_id")
      .eq("user_id", userId)
      .single();

    if (entitlementError) throw entitlementError;

    if (!entitlement.source_subscription_id) {
      return entitlement;
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("id", entitlement.source_subscription_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    return {
      ...entitlement,
      status: subscription?.status,
      cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
      tier_expires_at:
        subscription?.current_period_end ?? entitlement.tier_expires_at,
    };
  }
}
