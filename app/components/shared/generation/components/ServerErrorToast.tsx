"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

import { BILLING_SETTINGS_HREF } from "@/lib/credits/usageClient";

type ServerErrorToastProps = {
  message: string;
  showUpgradeCta: boolean;
  onDismiss: () => void;
};

export default function ServerErrorToast({
  message,
  showUpgradeCta,
  onDismiss,
}: ServerErrorToastProps) {
  const router = useRouter();

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300 fade-in">
      <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="shrink-0 text-red-600 dark:text-red-400 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{message}</p>
          {showUpgradeCta && (
            <button
              type="button"
              onClick={() => router.push(BILLING_SETTINGS_HREF)}
              className="mt-2 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Upgrade
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
