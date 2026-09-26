"use client";

import type { ReactNode } from "react";
import { Loader2, X } from "lucide-react";

import ServerErrorToast from "./ServerErrorToast";

type GenerationModalShellProps = {
  title: string;
  isProcessing: boolean;
  processingLabel: string;
  onClose: () => void;
  serverError: string | null;
  showUpgradeCta: boolean;
  onDismissError: () => void;
  footer: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
};

export default function GenerationModalShell({
  title,
  isProcessing,
  processingLabel,
  onClose,
  serverError,
  showUpgradeCta,
  onDismissError,
  footer,
  overlay,
  children,
}: GenerationModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-sm">
      {serverError && (
        <ServerErrorToast
          message={serverError}
          showUpgradeCta={showUpgradeCta}
          onDismiss={onDismissError}
        />
      )}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {isProcessing && (
          <div className="absolute inset-0 z-[60] bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center animate-fade-in">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {processingLabel}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {title}
          </h2>
          <button
            disabled={isProcessing}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`p-6 overflow-y-auto custom-scrollbar space-y-6 ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
        >
          {children}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          {footer}
        </div>

        {overlay}
      </div>
    </div>
  );
}
