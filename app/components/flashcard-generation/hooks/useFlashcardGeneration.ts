"use client";

import { useEffect, useState } from "react";

import { clampCount } from "@/app/components/shared/generation/utils";
import { useAuth } from "@/app/context/AuthContext";
import { useGenerationForm } from "@/app/hooks/useGenerationForm";
import { PublicServices } from "@/lib/publicServices";

import { generateDeckRequest } from "../api";
import {
  generationSourceReducer,
  initialGenerationSourceState,
  nextSourceError,
  validateGenerationSource,
  type GenerationSourceAction,
} from "../generationSource";
import type { FlashcardGenerationModalProps } from "../types";
import { useManualCards } from "./useManualCards";

export function useFlashcardGeneration({
  onClose,
  setIsProcessing,
  onDeckCreated,
  onDeckUpdated,
  userId,
  currFolderId,
  initialData,
  editMode,
}: FlashcardGenerationModalProps) {
  const { tier } = useAuth();
  const form = useGenerationForm();
  const cards = useManualCards(form.setFormErrors);
  const [cardCount, setCardCount] = useState<number | string>(10);
  const [generationSource, setGenerationSource] = useState(initialGenerationSourceState);

  const publicServices = new PublicServices();

  useEffect(() => {
    if (editMode && initialData) {
      form.setMode("manual");
      form.setTitle(initialData.title);
      form.setDescription(initialData.description);

      const formattedCards = initialData.flashcards.map((card: any) => ({
        id: card.id,
        front: card.prompt,
        back: card.answer,
      }));
      cards.setCards(formattedCards);
    }
  }, [editMode]);

  const handleClose = () => {
    onClose();
  };

  const handleGenerate = async () => {
    form.beginSubmit();

    const newErrors: typeof form.formErrors = {};
    let hasError = false;

    if (!form.title.trim()) {
      newErrors.title = "Please enter a deck title.";
      hasError = true;
    }

    if (form.mode === "ai") {
      const sourceError = validateGenerationSource(generationSource);
      if (sourceError) {
        newErrors.source = sourceError;
        hasError = true;
      }
    } else {
      if (cards.cards.length > 0) {
        const invalidCards = cards.cards.some(
          (c) => !c.front.trim() || !c.back.trim(),
        );
        if (invalidCards) {
          newErrors.manual = "Please fill out both Front and Back for all cards.";
          hasError = true;
        }
      }
    }

    if (hasError) {
      form.setFormErrors(newErrors);
      return;
    }

    if (editMode) {
      try {
        setIsProcessing(true);
        const cardsToUpdate = cards.cards.filter((card) =>
          cards.modifiedCardIds.has(card.id),
        );

        const updatedDeck = await publicServices.updateFlashcards(
          userId,
          initialData.id,
          form.title,
          form.description,
          cardsToUpdate,
          cards.deletedCardIds,
        );

        onDeckUpdated(updatedDeck);
        handleClose();
      } catch (error: any) {
        console.error(error);
        form.setServerError("An unexpected error occurred. Please try again.");
      } finally {
        setIsProcessing(false);
        return;
      }
    }

    const formatDeck = (response: any) => ({
      id: response.deck.id,
      type: "deck",
      title: response.deck.title,
      description: response.deck.description,
      mode: response.deck.mode,
      parent_id: response.deck.parent_id,
      created_at: response.deck.created_at,
      last_updated: response.deck.last_updated,
      isStarred: response.deck.isStarred,
      count: response.flashcards ? response.flashcards.length : 0,
    });
    setIsProcessing(true);

    try {
      let cardsToCreate;
      if (form.mode === "ai") {
        const { result, data } = await generateDeckRequest(
          form.title,
          generationSource,
          cardCount,
        );

        if (!result.ok) {
          if (form.applyCreditError(result.status, data, tier)) {
            return;
          }
          throw new Error(
            data.error || "Something went wrong generating your deck.",
          );
        }

        cardsToCreate = data.cards;
      } else {
        cardsToCreate = cards.cards;
      }

      const response = await publicServices.createDeck(
        userId,
        currFolderId,
        form.title,
        form.description,
        form.mode,
        cardsToCreate,
      );

      if (!response) {
        throw new Error("Failed to create deck");
      }

      const formattedDeck = formatDeck(response);
      console.log("Card count is: ", formattedDeck.count);
      onDeckCreated(formattedDeck);
      handleClose();
    } catch (error: any) {
      console.error(error);
      form.setServerError(
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardCountBlur = () => {
    setCardCount(clampCount(cardCount, 5, 50));
  };

  const handleGenerationSourceChange = (action: GenerationSourceAction) => {
    const next = generationSourceReducer(generationSource, action);
    setGenerationSource(next);
    form.setFormErrors((prev) => ({
      ...prev,
      source: nextSourceError(prev.source, action, next),
    }));
  };

  const handleClearAllClick = () => {
    form.setIsClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    cards.confirmClearAll();
    form.setIsClearConfirmOpen(false);
  };

  return {
    ...form,
    ...cards,
    editMode,
    cardCount,
    setCardCount,
    generationSource,
    handleGenerationSourceChange,
    handleClose,
    handleGenerate,
    handleCardCountBlur,
    handleClearAllClick,
    confirmClearAll,
  };
}
