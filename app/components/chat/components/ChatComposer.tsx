"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineSend } from "react-icons/ai";

import { BILLING_SETTINGS_HREF } from "@/lib/credits/usageClient";
import type { UsageSnapshot } from "@/lib/credits/types";

import type { CreditNotice, FileWithPreview } from "../types";
import { AttachmentList } from "./AttachmentList";
import { CreditNoticeBanner } from "./CreditNoticeBanner";
import { DictationButton } from "./DictationButton";
import { ModelSelector } from "./ModelSelector";
import { ToolsMenu } from "./ToolsMenu";
import { UploadMenu } from "./UploadMenu";
import { UsageBadge } from "./UsageBadge";

export type ChatComposerProps = {
  creditNotice: CreditNotice | null;
  onDismissCreditNotice: () => void;
  files: FileWithPreview[];
  onFileDelete: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadSelect: () => void;
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  handleInput: () => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isProcessing: boolean;
  isTextareaFocused: boolean;
  setIsTextareaFocused: (focused: boolean) => void;
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  isDictationEnabled: boolean;
  onDictateOpen: () => void;
  tier: string | null;
  usage: UsageSnapshot | null;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
};

export function ChatComposer({
  creditNotice,
  onDismissCreditNotice,
  files,
  onFileDelete,
  fileInputRef,
  onFileChange,
  onUploadSelect,
  userInput,
  setUserInput,
  handleInput,
  handlePaste,
  handleKeyPress,
  sendMessage,
  textareaRef,
  isProcessing,
  isTextareaFocused,
  setIsTextareaFocused,
  selectedTool,
  onToolSelect,
  isDictationEnabled,
  onDictateOpen,
  tier,
  usage,
  selectedModel,
  onModelSelect,
}: ChatComposerProps) {
  const router = useRouter();
  const [isOpenModel, setIsOpenModel] = useState(false);
  const [isOpenTools, setIsOpenTools] = useState(false);
  const [isOpenUpload, setIsOpenUpload] = useState(false);

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    setIsOpenModel(false);
  };

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
    setIsOpenTools(false);
  };

  const handleUploadSelect = () => {
    setIsOpenUpload(false);
    onUploadSelect();
  };

  const handleOverlayClick = (clickType: string) => {
    if (clickType === "model") setIsOpenModel(false);
    else if (clickType === "tools") setIsOpenTools(false);
    else setIsOpenUpload(false);
  };

  const anyDropdownOpen = isOpenModel || isOpenTools || isOpenUpload;

  return (
    <div className="bg-white dark:bg-chatDark w-full max-w-4xl mx-auto px-2">
      {creditNotice && (
        <CreditNoticeBanner
          message={creditNotice.message}
          showUpgrade={creditNotice.showUpgrade}
          onUpgrade={() => router.push(BILLING_SETTINGS_HREF)}
          onDismiss={onDismissCreditNotice}
        />
      )}
      <div
        className={`
        flex flex-col border p-2 bg-white dark:bg-slate-800 w-full mb-2 rounded-xl shadow-sm
        transition-all duration-300 ease-in-out 
        ${
          isTextareaFocused
            ? "border-gray-400 dark:border-slate-500 shadow-md"
            : "border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
        }`}
      >
        <AttachmentList files={files} onFileDelete={onFileDelete} />

        <div className={`flex items-center`}>
          <textarea
            id="message-input"
            ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
            placeholder="Type your message..."
            onPaste={handlePaste}
            wrap="hard"
            disabled={isProcessing}
            className="flex-1 mt-1 min-h-[20px] max-h-[150px] resize-none bg-transparent border-none outline-none overflow-y-auto pt-1 text-base break-words whitespace-normal text-black dark:text-textDark placeholder:text-gray-500 dark:placeholder:text-gray-400"
            value={userInput}
            onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setUserInput(e.target.value);
              handleInput();
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) =>
              handleKeyPress(e)
            }
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
          />
          <button
            id="send-btn"
            type="button"
            onClick={() => sendMessage()}
            disabled={isProcessing || !userInput}
            className={`w-8 h-8 p-1.5 flex items-center justify-center rounded-full border-none
            transition-colors duration-200 ease-in-out ${userInput ? "bg-black hover:bg-gray-600 dark:bg-white dark:hover:bg-gray-300" : "bg-gray-300 dark:bg-slate-600 cursor-not-allowed"}`}
          >
            <AiOutlineSend
              className={`w-5 h-5 ${userInput ? "text-white dark:text-black" : "text-gray-500 dark:text-gray-400"}`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-y-1 -ml-1">
          <div className="flex items-stretch gap-1">
            <UploadMenu
              isOpen={isOpenUpload}
              onToggle={() => setIsOpenUpload(!isOpenUpload)}
              onSelect={handleUploadSelect}
              isProcessing={isProcessing}
              fileInputRef={fileInputRef}
              onFileChange={onFileChange}
            />
            <ToolsMenu
              isOpen={isOpenTools}
              onToggle={() => setIsOpenTools(!isOpenTools)}
              selectedTool={selectedTool}
              onToolSelect={handleToolSelect}
              isProcessing={isProcessing}
            />
            <DictationButton
              isDictationEnabled={isDictationEnabled}
              isProcessing={isProcessing}
              onOpen={onDictateOpen}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <UsageBadge tier={tier} usage={usage} />
            <ModelSelector
              isOpen={isOpenModel}
              onToggle={() => setIsOpenModel(!isOpenModel)}
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
              selectedTool={selectedTool}
            />
          </div>
          {anyDropdownOpen && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => {
                const clickType = isOpenModel
                  ? "model"
                  : isOpenTools
                    ? "tools"
                    : "upload";
                handleOverlayClick(clickType);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
