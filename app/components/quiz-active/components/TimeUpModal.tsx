"use client";

import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

type TimeUpModalProps = {
  mounted: boolean;
  isOpen: boolean;
  onDismiss: () => void;
};

export default function TimeUpModal({
  mounted,
  isOpen,
  onDismiss,
}: TimeUpModalProps) {
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-violet-100 dark:bg-blue-900/30 rounded-full text-violet-600 dark:text-blue-400">
            <Clock size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Time&apos;s Up!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Your answers have been automatically submitted. All work has been
              saved and is ready for review.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              View Results
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
