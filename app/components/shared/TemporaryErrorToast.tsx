"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiX } from "react-icons/fi";

import { BILLING_SETTINGS_HREF } from "@/lib/credits/usageClient";

export const ERROR_TOAST_DURATION_MS = 5000;

type TemporaryErrorToastProps = {
  message: string;
  onDismiss: () => void;
  showUpgradeCta?: boolean;
  autoDismiss?: boolean;
  durationMs?: number;
};

export default function TemporaryErrorToast({
  message,
  onDismiss,
  showUpgradeCta = false,
  autoDismiss = true,
  durationMs = ERROR_TOAST_DURATION_MS,
}: TemporaryErrorToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
    // Restart the timer when the message changes, not when onDismiss is recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, autoDismiss, durationMs]);

  return (
    <div
      className="
        absolute top-[-72px] md:top-0 left-1/2 z-50
        flex items-center gap-3 px-6 py-3
        rounded-b-xl w-[calc(100%-2rem)] max-w-lg
        bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
        border-b border-red-200 dark:border-red-500/30
        animate-slide-down
      "
    >
      <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {message}
      </p>
      {showUpgradeCta && (
        <button
          type="button"
          onClick={() => router.push(BILLING_SETTINGS_HREF)}
          className="flex-shrink-0 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          Upgrade
        </button>
      )}
      <button
        onClick={onDismiss}
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        aria-label="Dismiss error"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}
