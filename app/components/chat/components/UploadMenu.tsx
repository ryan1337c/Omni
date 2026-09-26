"use client";

import { CiSquarePlus } from "react-icons/ci";
import { GoPaperclip } from "react-icons/go";
import { Check } from "lucide-react";

import { UPLOAD_OPTION } from "../constants";

type UploadMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isProcessing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function UploadMenu({
  isOpen,
  onToggle,
  onSelect,
  isProcessing,
  fileInputRef,
  onFileChange,
}: UploadMenuProps) {
  return (
    <div className="relative group flex items-center">
      <button
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out"
        onClick={onToggle}
        disabled={isProcessing}
      >
        <CiSquarePlus size="2em" className="text-gray-500 dark:text-gray-400" />
      </button>
      {!isOpen && (
        <div className="absolute bottom-full left-0 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          Add files and more
          <div className="absolute top-full left-6 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        onChange={onFileChange}
        className="hidden"
      />
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1">
          <button
            onClick={onSelect}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 text-left"
          >
            <GoPaperclip
              size={"25px"}
              className="flex-shrink-0 text-gray-600 dark:text-gray-300"
            />
            <div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              {UPLOAD_OPTION.name}
            </div>
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      )}
    </div>
  );
}
