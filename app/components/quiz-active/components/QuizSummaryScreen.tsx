"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import { formatTime } from "../utils";
import type { Question } from "../types";

type QuizSummaryScreenProps = {
  questions: Question[];
  selectedAnswers: Record<number, number>;
  timeLeft: number;
  onJump: (index: number) => void;
  onBackToQuiz: () => void;
  onSubmit: () => void;
};

export default function QuizSummaryScreen({
  questions,
  selectedAnswers,
  timeLeft,
  onJump,
  onBackToQuiz,
  onSubmit,
}: QuizSummaryScreenProps) {
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-gray-900 animate-fade-in overflow-hidden">
      <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Quiz Summary
        </h2>
        <div
          className={`flex items-center gap-2 ${timeLeft < 60 ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700"} px-3 py-1.5 rounded-lg text-sm font-medium font-mono`}
        >
          <Clock size={16} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              You have answered{" "}
              <span className="font-bold text-violet-600 dark:text-blue-500">
                {answeredCount}
              </span>{" "}
              out of{" "}
              <span className="font-bold">{questions.length}</span> questions.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              return (
                <button
                  key={idx}
                  onClick={() => onJump(idx)}
                  className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                      {q.question_text || `Question ${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnswered ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={14} />{" "}
                        <span className="hidden sm:inline">Answered</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                        <AlertTriangle size={14} />{" "}
                        <span className="hidden sm:inline">Incomplete</span>
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-16 md:h-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-10 flex-shrink-0">
        <button
          onClick={onBackToQuiz}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={20} /> Back
        </button>
        <button
          onClick={onSubmit}
          className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] text-white rounded-lg font-bold shadow-md transition-all"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}
