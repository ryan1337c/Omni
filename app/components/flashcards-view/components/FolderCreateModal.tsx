"use client";

import { Check, Folder, X } from "lucide-react";
import { createPortal } from "react-dom";

type FolderCreateModalProps = {
  mounted: boolean;
  isOpen: boolean;
  newFolderName: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

export default function FolderCreateModal({
  mounted,
  isOpen,
  newFolderName,
  onNameChange,
  onClose,
  onCreate,
}: FolderCreateModalProps) {
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm flex flex-col items-start animate-in zoom-in-95 duration-200">
        <div className="h-10 w-32 bg-white dark:bg-slate-800 rounded-t-xl relative z-10 translate-y-[1px]"></div>
        <div className="w-full bg-white dark:bg-slate-800 rounded-b-2xl rounded-tr-2xl border-4 border-white dark:border-slate-800 p-6 shadow-2xl relative z-20">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Folder size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  New Folder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Organize your decks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Name
              </label>
              <input
                autoFocus
                type="text"
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreate()}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={!newFolderName.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
