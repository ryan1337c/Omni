"use client";

import { useEffect, useState } from "react";

import { PublicServices } from "@/lib/publicServices";
import {
  getContextTooLongInfo,
  getInsufficientCreditsInfo,
} from "@/lib/credits/usageClient";
import type { ContextTooLongBody, InsufficientCreditsBody } from "@/lib/credits/usageClient";

import { generateImageRequest } from "../api";
import { GENERATED_IMAGE_CONTENT, MISSING_IMAGE_PLACEHOLDER_URL, MODELS } from "../constants";
import type { ChatMessage, FileWithPreview } from "../types";
import { getUnsupportedRequestReason, replaceLastMessage } from "../utils";

type UseImageGenerationParams = {
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectedModel: string;
  tier: string | null;
  refreshUsage: () => Promise<void>;
  applyCreditError: (info: InsufficientCreditsBody) => void;
  applyContextTooLongError: (info: ContextTooLongBody) => void;
  clearFiles: () => void;
  scrollToBottom: (behavior?: "smooth" | "auto") => void;
};

export function useImageGeneration({
  setIsProcessing,
  setChatHistory,
  selectedModel,
  tier,
  refreshUsage,
  applyCreditError,
  applyContextTooLongError,
  clearFiles,
  scrollToBottom,
}: UseImageGenerationParams) {
  const [image, setImage] = useState("");
  const [imageTrigger, setImageTrigger] = useState(false);
  const [imageCount, setImageCount] = useState<number>(1);
  const [isValid, setIsValid] = useState(true);
  const publicServices = new PublicServices();

  const selectedModelData = MODELS.find((model) => model.id === selectedModel);

  const generateImage = async (
    filesToUpload: FileWithPreview[],
    chatId: string | null,
    prompt: string,
  ) => {
    setIsProcessing(true);

    const unsupportedImageReason = getUnsupportedRequestReason(
      "image",
      filesToUpload,
      selectedModel,
    );
    if (unsupportedImageReason) {
      setChatHistory((prevHistory) =>
        replaceLastMessage(prevHistory, {
          content: unsupportedImageReason,
          loading: false,
        }),
      );
      clearFiles();
      setIsProcessing(false);
      return;
    }

    try {
      const { response, data } = await generateImageRequest(prompt);

      if (!response.ok) {
        const creditInfo = getInsufficientCreditsInfo(response.status, data);
        if (creditInfo) {
          applyCreditError(creditInfo);
          setIsProcessing(false);
          return;
        }
        const contextInfo = getContextTooLongInfo(response.status, data);
        if (contextInfo) {
          applyContextTooLongError(contextInfo);
          setIsProcessing(false);
          return;
        }
        setIsValid(false);
        throw new Error(
          data.error || "Something went wrong when generating image on server side",
        );
      }

      const imageUrls = await publicServices.uploadImages([data.url]);
      setImage(imageUrls[0].publicUrl);
      setIsValid(true);

      const generatedImages = {
        id: "",
        public_url: imageUrls[0].publicUrl,
        storage_path: imageUrls[0].storagePath,
        order_index: 0,
      };

      await publicServices.addMessages(chatId, [
        {
          role: "user",
          content: prompt,
          imagesData: [],
          loading: false,
          isNew: true,
        },
        {
          role: "assistant",
          content: GENERATED_IMAGE_CONTENT,
          imagesData: [generatedImages],
          loading: false,
          isNew: true,
        },
      ]);
      if (tier === "free") {
        void refreshUsage();
      }
    } catch (error: any) {
      console.error("Fetch failed: ", error.message || error);
      setImage("fail");
    }

    setImageTrigger((prev) => !prev);
  };

  useEffect(() => {
    if (image) {
      setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        const lastMessageIndex = updatedHistory.length - 1;
        updatedHistory[lastMessageIndex] = {
          ...updatedHistory[lastMessageIndex],
          ...(isValid
            ? {}
            : selectedModelData?.name === "DeepSeek v4 Flash"
              ? {
                  content:
                    "We do no currently support image generation for this model.",
                }
              : { content: "Message is not appropriate." }),
          imagesData:
            image !== "fail"
              ? [
                  {
                    id: "",
                    public_url: image ?? MISSING_IMAGE_PLACEHOLDER_URL,
                    storage_path: "",
                    order_index: 0,
                  },
                ]
              : [],
          loading: false,
        };

        setImageCount(imageCount + 1);
        return updatedHistory;
      });

      setTimeout(() => {
        scrollToBottom();
      }, 800);
    }
  }, [imageTrigger, image, isValid]);

  return { generateImage };
}
