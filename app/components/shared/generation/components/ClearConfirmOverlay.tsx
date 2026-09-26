"use client";

import { AlertTriangle } from "lucide-react";

type ClearConfirmOverlayProps = {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ClearConfirmOverlay({
  title,
  description,
  onCancel,
  onConfirm,
}: ClearConfirmOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {description}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Yes, Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
