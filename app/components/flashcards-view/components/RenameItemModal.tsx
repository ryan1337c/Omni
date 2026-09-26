"use client";

import { Pencil, X } from "lucide-react";
import { createPortal } from "react-dom";

import type { FlashcardItem } from "../types";

type RenameItemModalProps = {
  mounted: boolean;
  item: FlashcardItem | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function RenameItemModal({
  mounted,
  item,
  renameValue,
  onRenameValueChange,
  onClose,
  onSave,
}: RenameItemModalProps) {
  if (!mounted || !item) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200">
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                <Pencil size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Rename {item.type === "folder" ? "Folder" : "Deck"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update title
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
                Title
              </label>
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => onRenameValueChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSave()}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 focus:outline-none transition-colors placeholder:text-slate-400"
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
                onClick={onSave}
                disabled={!renameValue.trim() || renameValue === item.title}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
