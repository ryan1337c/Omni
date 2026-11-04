"use client";

import { PencilRuler, Sparkles, type LucideIcon } from "lucide-react";

import type { GenerationMode } from "@/app/components/shared/generation/types";

type CreationModeToggleProps = {
  mode: GenerationMode;
  isProcessing: boolean;
  onChange: (mode: GenerationMode) => void;
};

const SEGMENTS: { mode: GenerationMode; label: string; icon: LucideIcon }[] = [
  { mode: "manual", label: "Manual", icon: PencilRuler },
  { mode: "ai", label: "AI", icon: Sparkles },
];

export default function CreationModeToggle({
  mode,
  isProcessing,
  onChange,
}: CreationModeToggleProps) {
  return (
    <div className="flex justify-center">
      <div
        role="radiogroup"
        aria-label="Creation Mode"
        className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
      >
        {SEGMENTS.map(({ mode: segmentMode, label, icon: Icon }) => {
          const isSelected = mode === segmentMode;
          return (
            <button
              key={segmentMode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isProcessing}
              onClick={() => onChange(segmentMode)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
