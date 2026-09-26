"use client";

import { AlignLeft } from "lucide-react";

import type { Question } from "../types";
import NavigatorLegend from "./NavigatorLegend";
import QuestionNavButton from "./QuestionNavButton";

type QuizNavigatorSidebarProps = {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>;
  isSubmitted: boolean;
  onJump: (index: number) => void;
};

export default function QuizNavigatorSidebar({
  questions,
  currentQuestionIndex,
  selectedAnswers,
  isSubmitted,
  onJump,
}: QuizNavigatorSidebarProps) {
  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 hidden lg:flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <AlignLeft size={18} /> Quiz Navigator
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
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
      <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
        <NavigatorLegend isSubmitted={isSubmitted} variant="full" />
      </div>
    </div>
  );
}
