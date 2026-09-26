"use client";

import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

import type { FlashcardItem } from "../types";

type DeleteItemModalProps = {
  mounted: boolean;
  item: FlashcardItem | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteItemModal({
  mounted,
  item,
  onClose,
  onConfirm,
}: DeleteItemModalProps) {
  if (!mounted || !item) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 scale-100 transform transition-all">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Delete {item.type === "folder" ? "Folder" : "Deck"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &quot;{item.title}&quot;
              </span>
              ?{" "}
              {item.type === "folder" && " This will delete all items inside it."}{" "}
              <br />
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
