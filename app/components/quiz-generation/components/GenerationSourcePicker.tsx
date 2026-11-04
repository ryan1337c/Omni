"use client";

import { ClipboardList, NotebookText, PenLine, type LucideIcon } from "lucide-react";

import {
  GENERATION_SOURCE_KINDS,
  type GenerationSourceKind,
} from "@/lib/quiz/generationSourceKinds";

type GenerationSourceCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const GENERATION_SOURCE_CARDS: Record<GenerationSourceKind, GenerationSourceCard> = {
  fromScratch: {
    title: "From Scratch",
    description: "Describe a topic and the AI writes the quiz",
    icon: PenLine,
  },
  notes: {
    title: "Notes",
    description: "Upload study material and the AI writes questions from it",
    icon: NotebookText,
  },
  sampleTest: {
    title: "Sample Test",
    description: "Upload an exam or practice test and take its questions",
    icon: ClipboardList,
  },
};

type GenerationSourcePickerProps = {
  selected: GenerationSourceKind;
  isProcessing: boolean;
  onSelect: (source: GenerationSourceKind) => void;
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
        {GENERATION_SOURCE_KINDS.map((source) => {
          const { title, description, icon: Icon } = GENERATION_SOURCE_CARDS[source];
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
                  ? "border-violet-600 bg-violet-50 dark:border-btnDark dark:bg-btnDark/15"
                  : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-btnDark/60"
              }`}
            >
              <Icon
                size={20}
                className={
                  isSelected
                    ? "text-violet-600 dark:text-btnDark"
                    : "text-slate-400 dark:text-slate-500"
                }
              />
              <span
                className={`text-sm font-semibold ${isSelected ? "text-violet-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                {title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
