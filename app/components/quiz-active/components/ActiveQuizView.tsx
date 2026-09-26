"use client";

import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  X,
} from "lucide-react";

import { formatTime } from "../utils";
import type { Question, QuizScore } from "../types";
import ChoiceOptionButton from "./ChoiceOptionButton";
import ExitConfirmModal from "./ExitConfirmModal";
import MobileNavDrawer from "./MobileNavDrawer";
import QuizNavigatorSidebar from "./QuizNavigatorSidebar";
import TimeUpModal from "./TimeUpModal";

type ActiveQuizViewProps = {
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question;
  selectedAnswers: Record<number, number>;
  isSubmitted: boolean;
  timeLeft: number;
  score: QuizScore;
  mounted: boolean;
  isMobileNavOpen: boolean;
  isExitConfirmOpen: boolean;
  isTimeUpOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  setIsExitConfirmOpen: (open: boolean) => void;
  setIsTimeUpOpen: (open: boolean) => void;
  onOptionSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onExitClick: () => void;
  onJump: (index: number) => void;
  onConfirmExit: () => void;
};

export default function ActiveQuizView({
  questions,
  currentQuestionIndex,
  currentQuestion,
  selectedAnswers,
  isSubmitted,
  timeLeft,
  score,
  mounted,
  isMobileNavOpen,
  isExitConfirmOpen,
  isTimeUpOpen,
  setIsMobileNavOpen,
  setIsExitConfirmOpen,
  setIsTimeUpOpen,
  onOptionSelect,
  onPrev,
  onNext,
  onExitClick,
  onJump,
  onConfirmExit,
}: ActiveQuizViewProps) {
  return (
    <div
      className={`flex h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden animate-fade-in relative`}
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LayoutGrid size={24} />
            </button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Question</span>{" "}
              {currentQuestionIndex + 1}{" "}
              <span className="text-slate-300 dark:text-slate-600">/</span>{" "}
              {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {isSubmitted ? (
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600">
                <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                  Grade
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {score.points}
                </span>
                <span className="text-slate-500 dark:text-slate-400 mx-1">
                  out of
                </span>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">
                  {score.totalPoints}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ({score.percentage}%)
                </span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${timeLeft < 60 ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700"}`}
              >
                <Clock size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onExitClick}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              title="Exit Quiz"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-white leading-relaxed">
              {currentQuestion.question_text}
            </div>

            <div className="space-y-3">
              {currentQuestion.choices.map((option, index) => (
                <ChoiceOptionButton
                  key={index}
                  option={option}
                  index={index}
                  isSelected={selectedAnswers[currentQuestionIndex] === index}
                  isSubmitted={isSubmitted}
                  onSelect={onOptionSelect}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="h-16 md:h-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-10 flex-shrink-0">
          <button
            onClick={onPrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          <button
            onClick={onNext}
            className={`flex items-center gap-2 px-5 md:px-6 py-2 md:py-2.5 text-white rounded-lg font-medium shadow-md transition-all text-sm md:text-base ${
              isSubmitted
                ? "bg-slate-700 hover:bg-slate-800"
                : "bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9]"
            }`}
          >
            {currentQuestionIndex === questions.length - 1
              ? isSubmitted
                ? "Exit"
                : "Finish"
              : "Next"}
            {currentQuestionIndex !== questions.length - 1 && (
              <ChevronRight size={20} />
            )}
            {currentQuestionIndex === questions.length - 1 &&
              !isSubmitted && <CheckSquare size={18} />}
          </button>
        </div>
      </div>

      <QuizNavigatorSidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswers={selectedAnswers}
        isSubmitted={isSubmitted}
        onJump={onJump}
      />

      <MobileNavDrawer
        mounted={mounted}
        isOpen={isMobileNavOpen}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswers={selectedAnswers}
        isSubmitted={isSubmitted}
        onClose={() => setIsMobileNavOpen(false)}
        onJump={onJump}
      />

      <ExitConfirmModal
        mounted={mounted}
        isOpen={isExitConfirmOpen}
        onCancel={() => setIsExitConfirmOpen(false)}
        onConfirm={onConfirmExit}
      />

      <TimeUpModal
        mounted={mounted}
        isOpen={isTimeUpOpen}
        onDismiss={() => setIsTimeUpOpen(false)}
      />
    </div>
  );
}
