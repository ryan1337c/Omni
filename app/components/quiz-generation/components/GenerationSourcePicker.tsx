"use client";

import { NotebookText, PenLine, type LucideIcon } from "lucide-react";

import type { GenerationSource } from "../generationSource";

type GenerationSourceCard = {
  source: GenerationSource;
  title: string;
  description: string;
  icon: LucideIcon;
};

const GENERATION_SOURCE_CARDS: GenerationSourceCard[] = [
  {
    source: "fromScratch",
    title: "From Scratch",
    description: "Describe a topic and the AI writes the quiz",
    icon: PenLine,
  },
  {
    source: "notes",
    title: "Notes",
    description: "Upload study material and the AI writes questions from it",
    icon: NotebookText,
  },
];

type GenerationSourcePickerProps = {
  selected: GenerationSource;
  isProcessing: boolean;
  onSelect: (source: GenerationSource) => void;
};

export default function GenerationSourcePicker({
  selected,
  isProcessing,
  onSelect,
}: GenerationSourcePickerProps) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        Generation Source
      </span>
      <div
        role="radiogroup"
        aria-label="Generation Source"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {GENERATION_SOURCE_CARDS.map(
          ({ source, title, description, icon: Icon }) => {
            const isSelected = selected === source;
            return (
              <button
                key={source}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isProcessing}
                onClick={() => onSelect(source)}
                className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-slate-500"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    isSelected
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-slate-400"
                  }
                />
                <span
                  className={`text-sm font-semibold ${isSelected ? "text-violet-900 dark:text-violet-100" : "text-slate-600 dark:text-slate-300"}`}
                >
                  {title}
                </span>
                <span className="text-xs text-slate-500">{description}</span>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
