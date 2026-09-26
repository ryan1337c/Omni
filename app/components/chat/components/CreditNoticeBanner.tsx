"use client";

import { X } from "lucide-react";

type CreditNoticeBannerProps = {
  message: string;
  showUpgrade: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
};

export function CreditNoticeBanner({
  message,
  showUpgrade,
  onUpgrade,
  onDismiss,
}: CreditNoticeBannerProps) {
  return (
    <div className="mb-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
      <p className="min-w-0 flex-1">{message}</p>
      {showUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="flex-shrink-0 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          Upgrade
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss credit notice"
        className="flex-shrink-0 rounded-full p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-400/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
