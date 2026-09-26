"use client";

import { VscMic } from "react-icons/vsc";

type DictationButtonProps = {
  isDictationEnabled: boolean;
  isProcessing: boolean;
  onOpen: () => void;
};

export function DictationButton({
  isDictationEnabled,
  isProcessing,
  onOpen,
}: DictationButtonProps) {
  return (
    <div className="relative group flex items-center">
      <button
        className={`relative p-2.5 rounded-full text-sm font-medium transition-colors ${
          isDictationEnabled
            ? "text-gray-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-700"
            : "cursor-not-allowed text-gray-400 dark:text-gray-600"
        }`}
        onClick={onOpen}
        disabled={isProcessing || !isDictationEnabled}
        aria-label={
          isDictationEnabled ? "Open dictation" : "Dictation is disabled"
        }
      >
        <VscMic size="20px" />
        {!isDictationEnabled && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current"
          />
        )}
      </button>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 ease-out group-hover:delay-200">
        {isDictationEnabled ? "Dictate" : "Dictation is disabled in Settings"}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
