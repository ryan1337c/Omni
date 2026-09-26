"use client";

import { PencilRuler, Sparkles } from "lucide-react";

import type { GenerationMode } from "../types";

type ModeSelectorProps = {
  mode: GenerationMode;
  isProcessing: boolean;
  aiDescription: string;
  onChange: (mode: GenerationMode) => void;
};

export default function ModeSelector({
  mode,
  isProcessing,
  aiDescription,
  onChange,
}: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        disabled={isProcessing}
        onClick={() => onChange("manual")}
        className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === "manual"
            ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
            : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-slate-500"
        }`}
      >
        <PencilRuler
          size={24}
          className={
            mode === "manual"
              ? "text-violet-600 dark:text-violet-400"
              : "text-slate-400"
          }
        />
        <div className="text-center">
          <span
            className={`block font-semibold ${mode === "manual" ? "text-violet-900 dark:text-violet-100" : "text-slate-600 dark:text-slate-300"}`}
          >
            Manual
          </span>
          <span className="text-xs text-slate-500">Create from scratch</span>
        </div>
      </button>

      <button
        disabled={isProcessing}
        onClick={() => onChange("ai")}
        className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === "ai"
            ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
            : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-slate-500"
        }`}
      >
        <Sparkles
          size={24}
          className={
            mode === "ai"
              ? "text-violet-600 dark:text-violet-400"
              : "text-slate-400"
          }
        />
        <div className="text-center">
          <span
            className={`block font-semibold ${mode === "ai" ? "text-violet-900 dark:text-violet-100" : "text-slate-600 dark:text-slate-300"}`}
          >
            Generate with AI
          </span>
          <span className="text-xs text-slate-500">{aiDescription}</span>
        </div>
      </button>
    </div>
  );
}
