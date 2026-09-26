"use client";

import { Clock, FileText } from "lucide-react";

import { formatTime } from "../utils";
import type { Question } from "../types";

type QuizStartScreenProps = {
  quizTitle: string;
  questions: Question[];
  duration: number;
  onExit: () => void;
  onStart: () => void;
};

export default function QuizStartScreen({
  quizTitle,
  questions,
  duration,
  onExit,
  onStart,
}: QuizStartScreenProps) {
  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-gray-900 items-center justify-center p-4 md:p-6 animate-fade-in">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="h-32 md:h-40 bg-gradient-to-r from-violet-600 to-indigo-600 relative shrink-0">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar z-10">
            <div className="min-h-full w-full flex items-center justify-center p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white text-center break-words leading-tight">
                {quizTitle}
              </h1>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 text-center space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
              Ready to begin?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-2 text-sm md:text-base">
                <FileText size={18} /> {questions.length} Questions
              </span>
              <span className="flex items-center gap-2 text-sm md:text-base">
                <Clock size={18} /> {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-center mt-8">
            <button
              onClick={onExit}
              className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onStart}
              className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Begin Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
