"use client";

import { Check } from "lucide-react";

import type { Question } from "../types";

type QuestionNavButtonProps = {
  idx: number;
  isCurrent: boolean;
  userAns: number | undefined;
  isSubmitted: boolean;
  question: Question;
  onJump: (index: number) => void;
};

export default function QuestionNavButton({
  idx,
  isCurrent,
  userAns,
  isSubmitted,
  question,
  onJump,
}: QuestionNavButtonProps) {
  let borderClass = "border-slate-200 dark:border-slate-600";
  let statusBg = "bg-slate-100 dark:bg-slate-700";
  let Icon = null;

  if (isSubmitted) {
    const isCorrect = question.choices[userAns ?? -1]?.is_correct;

    if (userAns === undefined) {
      statusBg = "bg-slate-400 dark:bg-slate-600";
    } else if (isCorrect) {
      statusBg = "bg-green-600";
      Icon = Check;
    } else {
      statusBg = "bg-red-600";
    }
  } else if (userAns !== undefined) {
    statusBg = "bg-violet-600";
  }

  if (isCurrent) {
    borderClass =
      "border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900 z-10";
  }

  return (
    <button
      onClick={() => onJump(idx)}
      className={`
                flex flex-col items-stretch overflow-hidden rounded-lg border transition-all 
                aspect-[3/4] ${borderClass} hover:border-violet-400
            `}
    >
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm">
        {idx + 1}
      </div>
      <div
        className={`h-[35%] flex items-center justify-center ${statusBg} transition-colors duration-200`}
      >
        {Icon && <Icon size={12} strokeWidth={4} className="text-white" />}
      </div>
    </button>
  );
}
