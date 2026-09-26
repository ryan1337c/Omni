"use client";

import { useCallback } from "react";

import Messages from "@/util/assistantMessages";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import type { RecentChat } from "@/app/components/home";

import type { ChatMessage, FileWithPreview } from "../types";
import { getUnsupportedRequestReason } from "../utils";
import { useImageGeneration } from "./useImageGeneration";
import { useTextGeneration } from "./useTextGeneration";

type UseChatSendParams = {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
  clearFiles: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currChatId: string | null;
  setCurrChatId: (id: string) => void;
  setRecents: React.Dispatch<React.SetStateAction<RecentChat[]>>;
  chatMode: string;
  setChatMode: (mode: string) => void;
  selectedTool: string;
  selectedModel: string;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setCreditNotice: React.Dispatch<
    React.SetStateAction<{ message: string; showUpgrade: boolean } | null>
  >;
  tier: string | null;
  refreshUsage: () => Promise<void>;
  applyCreditError: (info: import("@/lib/credits/usageClient").InsufficientCreditsBody) => void;
  applyContextTooLongError: (info: import("@/lib/credits/usageClient").ContextTooLongBody) => void;
  scrollToBottom: (behavior?: "smooth" | "auto") => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

export function useChatSend(params: UseChatSendParams) {
  const {
    userInput,
    setUserInput,
    files,
    setFiles,
    clearFiles,
    fileInputRef,
    chatHistory,
    setChatHistory,
    currChatId,
    setCurrChatId,
    setRecents,
    chatMode,
    setChatMode,
    selectedTool,
    selectedModel,
    setIsProcessing,
    setCreditNotice,
    tier,
    refreshUsage,
    applyCreditError,
    applyContextTooLongError,
    scrollToBottom,
    textareaRef,
  } = params;

  const authServices = new AuthServices();
  const publicServices = new PublicServices();

  const { generateImage } = useImageGeneration({
    setIsProcessing,
    setChatHistory,
    selectedModel,
    tier,
    refreshUsage,
    applyCreditError,
    applyContextTooLongError,
    clearFiles,
    scrollToBottom,
  });

  const { generateResponse } = useTextGeneration({
    setIsProcessing,
    setChatHistory,
    selectedModel,
    tier,
    refreshUsage,
    applyCreditError,
    applyContextTooLongError,
    setFiles,
  });

  const isRequestSupported = (
    tool: string,
    filesToUpload: FileWithPreview[],
  ): boolean =>
    getUnsupportedRequestReason(tool, filesToUpload, selectedModel) === null;

  const sendMessage = async () => {
    if (userInput || files.length > 0) {
      try {
        const prompt = userInput;
        setCreditNotice(null);
        let activeChatId = currChatId;

        const filesToProcess = [...files];
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        if (
          chatMode === "new chat" &&
          isRequestSupported(selectedTool, filesToProcess)
        ) {
          const session = await authServices.getSession();
          const { id } = session.user;

          const newHistory = {
            chat_title: userInput.substring(0, 50) || "New Chat",
          };

          const data = await publicServices.addHistory(id, newHistory);
          activeChatId = data.chat_id;
          setCurrChatId(data.chat_id);
          setRecents((prev) => [data, ...prev]);
          setChatMode("recents");
        }

        const temporaryImages = filesToProcess.map((file, index) => ({
          id: `temp-${index}-${Date.now()}`,
          public_url: file.preview,
          storage_path: "",
          order_index: index,
        }));

        const userMessage: ChatMessage = {
          role: "user",
          content: userInput,
          imagesData: temporaryImages,
          loading: false,
          isNew: true,
        };

        const aiPlaceholderMessage: ChatMessage = {
          role: "assistant",
          content: selectedTool === "image" ? Messages.imgGeneration : "",
          imagesData: [],
          loading: true,
          isNew: true,
        };

        const newMessages = [...chatHistory, userMessage, aiPlaceholderMessage];

        setChatHistory((prevHistory) => [
          ...prevHistory,
          userMessage,
          aiPlaceholderMessage,
        ]);
        setUserInput("");

        setTimeout(() => {
          scrollToBottom();
        }, 100);

        const messageInput = document.getElementById(
          "message-input",
        ) as HTMLInputElement;
        messageInput.value = "";

        if (selectedTool === "image")
          await generateImage(filesToProcess, activeChatId, prompt);
        else await generateResponse(filesToProcess, newMessages, activeChatId);

        if (textareaRef.current) {
          textareaRef.current.blur();
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 10);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (userInput.trim()) sendMessage();
    }
  };

  const handleTypingComplete = useCallback(() => {
    setIsProcessing(false);
    setChatHistory((prevHistory) => {
      if (prevHistory.length === 0) {
        return prevHistory;
      }

      const lastIndex = prevHistory.length - 1;
      const lastMessage = prevHistory[lastIndex];

      if (lastMessage && lastMessage.isNew) {
        const updatedHistory = [...prevHistory];
        updatedHistory[lastIndex] = { ...lastMessage, isNew: false };
        return updatedHistory;
      }

      return prevHistory;
    });
  }, [setIsProcessing, setChatHistory]);

  return { sendMessage, handleKeyPress, handleTypingComplete };
}
