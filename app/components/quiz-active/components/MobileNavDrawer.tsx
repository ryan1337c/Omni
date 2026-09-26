"use client";

import { createPortal } from "react-dom";
import { AlignLeft, X } from "lucide-react";

import type { Question } from "../types";
import NavigatorLegend from "./NavigatorLegend";
import QuestionNavButton from "./QuestionNavButton";

type MobileNavDrawerProps = {
  mounted: boolean;
  isOpen: boolean;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>;
  isSubmitted: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
};

export default function MobileNavDrawer({
  mounted,
  isOpen,
  questions,
  currentQuestionIndex,
  selectedAnswers,
  isSubmitted,
  onClose,
  onJump,
}: MobileNavDrawerProps) {
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
      <div
        className="absolute inset-0 bg-black/50  animate-in fade-in"
        onClick={onClose}
      />
      <div className="relative w-72 h-[100dvh] bg-white dark:bg-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <AlignLeft size={18} /> Navigator
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <QuestionNavButton
                key={idx}
                idx={idx}
                isCurrent={currentQuestionIndex === idx}
                userAns={selectedAnswers[idx]}
                isSubmitted={isSubmitted}
                question={q}
                onJump={onJump}
              />
            ))}
          </div>
        </div>
        <div className="p-4 pb-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <NavigatorLegend isSubmitted={isSubmitted} variant="compact" />
        </div>
      </div>
    </div>,
    document.body
  );
}
