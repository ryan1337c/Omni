"use client";

import { PublicServices } from "@/lib/publicServices";
import {
  getContextTooLongInfo,
  getInsufficientCreditsInfo,
} from "@/lib/credits/usageClient";
import type { ContextTooLongBody, InsufficientCreditsBody } from "@/lib/credits/usageClient";

import { generateChatRequest } from "../api";
import type { ChatMessage, FileWithPreview, MessageImage } from "../types";
import { filterForOpenAI, replaceLastMessage } from "../utils";

type UseTextGenerationParams = {
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectedModel: string;
  tier: string | null;
  refreshUsage: () => Promise<void>;
  applyCreditError: (info: InsufficientCreditsBody) => void;
  applyContextTooLongError: (info: ContextTooLongBody) => void;
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
};

export function useTextGeneration({
  setIsProcessing,
  setChatHistory,
  selectedModel,
  tier,
  refreshUsage,
  applyCreditError,
  applyContextTooLongError,
  setFiles,
}: UseTextGenerationParams) {
  const publicServices = new PublicServices();

  const generateResponse = async (
    filesToUpload: FileWithPreview[],
    messages: ChatMessage[],
    chatId: string | null,
  ) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("modelId", selectedModel);
      formData.append("history", JSON.stringify(filterForOpenAI(messages)));

      const userMessage = messages[messages.length - 2];

      if (filesToUpload.length > 0) {
        filesToUpload.forEach((f) => formData.append("files", f));
        formData.append("userInput", userMessage.content);
      }

      const { response, data } = await generateChatRequest(formData);

      if (!response.ok) {
        const creditInfo = getInsufficientCreditsInfo(response.status, data);
        if (creditInfo) {
          applyCreditError(creditInfo);
          return;
        }
        const contextInfo = getContextTooLongInfo(response.status, data);
        if (contextInfo) {
          applyContextTooLongError(contextInfo);
          return;
        }
        throw new Error(data.error || "Something went wrong");
      }

      const aiMessage = data.response;

      let uploadedImages: MessageImage[] = [];
      if (filesToUpload.length > 0) {
        const blobUrls = filesToUpload.map((f) => f.preview);
        const imageData = await publicServices.uploadImages(blobUrls);

        uploadedImages = imageData.map((image, index) => ({
          id: "",
          public_url: image.publicUrl,
          storage_path: image.storagePath,
          order_index: index,
        }));
      }

      const updatedUserMessage = {
        ...userMessage,
        imagesData: uploadedImages,
      };

      await publicServices.addMessages(chatId, [
        updatedUserMessage,
        {
          role: "assistant",
          content: aiMessage,
          imagesData: [],
          loading: false,
          isNew: true,
        },
      ]);

      setChatHistory((prevHistory) => {
        const updated = [...prevHistory];
        updated[updated.length - 2] = updatedUserMessage;
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: aiMessage,
          loading: false,
        };
        return updated;
      });
      if (tier === "free") {
        void refreshUsage();
      }
    } catch (error: any) {
      console.error("Fetch failed: ", error.message || error);
      setFiles([]);
      setChatHistory((prevHistory) =>
        replaceLastMessage(prevHistory, {
          content: `${error.message}`,
          loading: false,
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return { generateResponse };
}
