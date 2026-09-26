"use client";

import { useEffect, useRef, useState } from "react";

import SpeechRecognitionModal from "@/app/components/SpeechRecognitionModal";
import { useAuth } from "@/app/context/AuthContext";

import { ChatComposer } from "./components/ChatComposer";
import { EmptyChatState } from "./components/EmptyChatState";
import { MessageList } from "./components/MessageList";
import { useChatHistory } from "./hooks/useChatHistory";
import { useChatScroll } from "./hooks/useChatScroll";
import { useChatSend } from "./hooks/useChatSend";
import { useCodeCopy } from "./hooks/useCodeCopy";
import { useCreditUsage } from "./hooks/useCreditUsage";
import { useDictation } from "./hooks/useDictation";
import { useFileAttachments } from "./hooks/useFileAttachments";
import { useTextareaAutoResize } from "./hooks/useTextareaAutoResize";
import type { ChatProps } from "./types";

export default function Chat({
  setRecents,
  currChatId,
  setCurrChatId,
  isProcessing,
  setIsProcessing,
}: ChatProps) {
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const { chatMode, setChatMode, tier } = useAuth();

  const { chatHistory, setChatHistory } = useChatHistory(currChatId);
  const { textareaRef, handleInput } = useTextareaAutoResize();
  const {
    usage,
    creditNotice,
    setCreditNotice,
    refreshUsage,
    applyCreditError,
    applyContextTooLongError,
  } = useCreditUsage(tier, setChatHistory);

  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [selectedTool, setSelectedTool] = useState("reasoning");

  const {
    files,
    setFiles,
    fileInputRef,
    clearFiles,
    handleUploadSelect,
    handleFileChange,
    handleFileDelete,
    handlePaste,
  } = useFileAttachments();

  const {
    isDictateModalOpen,
    setIsDictateModalOpen,
    isDictationEnabled,
  } = useDictation();

  const { scrollToBottom, isAutoScroll } = useChatScroll(
    chatMode,
    chatHistory,
    chatBoxRef,
    messagesEndRef,
  );

  useCodeCopy();

  const { sendMessage, handleKeyPress, handleTypingComplete } = useChatSend({
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
  });

  useEffect(() => {
    handleInput();
  }, [chatMode]);

  const handleDictateTranscript = (text: string) => {
    setUserInput((prev) => (prev ? `${prev} ${text}` : text));
    setIsDictateModalOpen(false);

    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        handleInput();
      }, 0);
    }
  };

  const composer = (
    <ChatComposer
      creditNotice={creditNotice}
      onDismissCreditNotice={() => setCreditNotice(null)}
      files={files}
      onFileDelete={handleFileDelete}
      fileInputRef={fileInputRef}
      onFileChange={handleFileChange}
      onUploadSelect={handleUploadSelect}
      userInput={userInput}
      setUserInput={setUserInput}
      handleInput={handleInput}
      handlePaste={handlePaste}
      handleKeyPress={handleKeyPress}
      sendMessage={sendMessage}
      textareaRef={textareaRef}
      isProcessing={isProcessing}
      isTextareaFocused={isTextareaFocused}
      setIsTextareaFocused={setIsTextareaFocused}
      selectedTool={selectedTool}
      onToolSelect={setSelectedTool}
      isDictationEnabled={isDictationEnabled}
      onDictateOpen={() => setIsDictateModalOpen(true)}
      tier={tier}
      usage={usage}
      selectedModel={selectedModel}
      onModelSelect={setSelectedModel}
    />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 dark:text-white dark:bg-chatDark">
      {chatHistory.length === 0 && chatMode === "new chat" ? (
        <EmptyChatState>{composer}</EmptyChatState>
      ) : (
        <div className="w-full flex flex-col flex-1 min-h-0 animate-fade-in-sm">
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 overflow-hidden">
              <div
                id="chat-box"
                ref={chatBoxRef}
                className="h-full overflow-y-auto scrollbar-custom w-full"
              >
                <MessageList
                  chatHistory={chatHistory}
                  chatBoxRef={chatBoxRef}
                  messagesEndRef={messagesEndRef}
                  isAutoScrollRef={isAutoScroll}
                  onTypingComplete={handleTypingComplete}
                />
              </div>
            </div>
          </div>
          <div className="w-full sticky bottom-0 z-10 bg-white dark:bg-chatDark flex-shrink-0">
            {composer}
          </div>
        </div>
      )}
      <SpeechRecognitionModal
        isOpen={isDictateModalOpen}
        onClose={() => setIsDictateModalOpen(false)}
        onTranscript={handleDictateTranscript}
      />
    </div>
  );
}
