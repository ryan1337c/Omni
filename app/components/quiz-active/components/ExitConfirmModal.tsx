"use client";

import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

type ExitConfirmModalProps = {
  mounted: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ExitConfirmModal({
  mounted,
  isOpen,
  onCancel,
  onConfirm,
}: ExitConfirmModalProps) {
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Exit Quiz?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to leave? Your progress will{" "}
              <span className="font-bold text-red-500">not be saved</span>.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
