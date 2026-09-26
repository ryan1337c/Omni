"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type GeneralSectionProps = {
  isFreeTier: boolean;
  onUpgrade: () => void;
  appearanceMenu: ReactNode;
  isDictationEnabled: boolean;
  onToggleDictation: () => void;
};

export default function GeneralSection({
  isFreeTier,
  onUpgrade,
  appearanceMenu,
  isDictationEnabled,
  onToggleDictation,
}: GeneralSectionProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        General
      </h3>
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

      {isFreeTier && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white">
              Do more with Omni
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Get higher limits and access advanced features.
            </p>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:-translate-y-0.5"
          >
            <Sparkles size={15} />
            Upgrade
          </button>
        </div>
      )}

      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        <div className="flex min-h-14 items-center justify-between gap-4 py-3">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Appearance
          </span>

          {appearanceMenu}
        </div>

        <div className="flex min-h-16 items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Enable Dictation
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Use speech-to-text when composing a message.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDictationEnabled}
            onClick={onToggleDictation}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              isDictationEnabled
                ? "bg-violet-600 dark:bg-purple-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isDictationEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
