"use client";

import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import type { Choice } from "../types";

type ChoiceOptionButtonProps = {
  option: Choice;
  index: number;
  isSelected: boolean;
  isSubmitted: boolean;
  onSelect: (index: number) => void;
};

export default function ChoiceOptionButton({
  option,
  index,
  isSelected,
  isSubmitted,
  onSelect,
}: ChoiceOptionButtonProps) {
  const isCorrect = option.is_correct;

  let containerClass = "";
  let circleClass = "";
  let textClass = "";
  let icon: ReactNode = null;

  if (isSubmitted) {
    containerClass = "border-2 cursor-not-allowed ";

    if (isCorrect) {
      if (isSelected) {
        containerClass +=
          "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50";
        circleClass = "border-green-600 bg-green-600 text-white";
        textClass = "text-green-900 dark:text-green-100 font-medium";
        icon = <CheckCircle2 size={16} strokeWidth={3} />;
      } else {
        containerClass +=
          "border-green-500 border-dashed bg-white dark:bg-slate-800 opacity-80";
        circleClass = "border-green-500 text-green-600";
        textClass = "text-green-700 dark:text-green-400";
        icon = <CheckCircle2 size={16} />;
      }
    } else if (isSelected) {
      containerClass +=
        "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50";
      circleClass = "border-red-600 bg-red-600 text-white";
      textClass = "text-red-900 dark:text-red-100 font-medium";
      icon = <XCircle size={16} strokeWidth={3} />;
    } else {
      containerClass +=
        "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60";
      circleClass = "border-slate-300 dark:border-slate-600";
      textClass = "text-slate-400 dark:text-slate-600";
    }
  } else {
    containerClass = "border-2 cursor-pointer transition-all ";

    if (isSelected) {
      containerClass +=
        "border-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500";
      circleClass = "border-violet-600 bg-white dark:bg-slate-800";
      textClass = "text-violet-900 dark:text-violet-100 font-medium";
    } else {
      containerClass +=
        "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-slate-600";
      circleClass =
        "border-slate-300 dark:border-slate-600 group-hover:border-violet-400";
      textClass = "text-slate-700 dark:text-slate-300";
    }
  }

  return (
    <button
      key={index}
      onClick={() => onSelect(index)}
      disabled={isSubmitted}
      className={`w-full text-left p-3 md:p-4 rounded-xl flex items-start gap-4 group ${containerClass}`}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${circleClass}`}
      >
        {isSubmitted ? (
          icon ||
          (isSelected && <div className="w-3 h-3 rounded-full bg-slate-400" />)
        ) : isSelected ? (
          <div className="w-3 h-3 rounded-full bg-violet-600 dark:bg-violet-500"></div>
        ) : (
          <span className="text-transparent text-xs">A</span>
        )}
      </div>
      <span className={`text-sm md:text-base ${textClass}`}>
        {option.choice_text}
      </span>
    </button>
  );
}
