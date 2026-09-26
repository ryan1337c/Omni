"use client";

import {
  AlertTriangle,
  AlignLeft,
  CheckCircle2,
  Circle,
  Eraser,
  ListChecks,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  INPUT_BASE_CLASSES,
  getBorderClasses,
} from "@/app/components/shared/generation";

import type { ManualQuestion } from "../types";
import DurationSelect from "./DurationSelect";

type ManualQuestionsEditorProps = {
  questions: ManualQuestion[];
  manualError?: string;
  isProcessing: boolean;
  duration: string;
  onClearAll: () => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (id: string) => void;
  onUpdateQuestionText: (id: string, text: string) => void;
  onUpdateQuestionType: (
    id: string,
    type: "multiple_choice" | "short_answer",
  ) => void;
  onSetCorrectAnswer: (id: string, index: number) => void;
  onAddOption: (id: string) => void;
  onRemoveOption: (id: string, idx: number) => void;
  onUpdateOptionText: (id: string, idx: number, text: string) => void;
  onDurationChange: (value: string) => void;
};

export default function ManualQuestionsEditor({
  questions,
  manualError,
  isProcessing,
  duration,
  onClearAll,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateQuestionText,
  onUpdateQuestionType,
  onSetCorrectAnswer,
  onAddOption,
  onRemoveOption,
  onUpdateOptionText,
  onDurationChange,
}: ManualQuestionsEditorProps) {
  return (
    <div className="space-y-6 animate-fade-in-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Questions ({questions.length})
        </h3>
        <button
          onClick={onClearAll}
          disabled={isProcessing}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser size={14} /> Clear All
        </button>
      </div>

      {manualError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-300 text-sm animate-fade-in-sm">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <p>{manualError}</p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"
          >
            <div className="flex gap-3 mb-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                {qIndex + 1}
              </span>
              <div className="flex-grow space-y-3">
                <input
                  type="text"
                  disabled={isProcessing}
                  placeholder="Type your question here..."
                  value={q.question_text}
                  onChange={(e) => onUpdateQuestionText(q.id, e.target.value)}
                  className={`${INPUT_BASE_CLASSES} placeholder-slate-400 bg-white dark:bg-slate-800 outline-none ${getBorderClasses(!!manualError && !q.question_text.trim())}`}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateQuestionType(q.id, "multiple_choice")}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      q.type === "multiple_choice"
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <ListChecks size={14} /> Multiple Choice
                  </button>
                  <button
                    onClick={() => onUpdateQuestionType(q.id, "short_answer")}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      q.type === "short_answer"
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <AlignLeft size={14} /> Short/Long Answer
                  </button>
                </div>
              </div>

              <button
                onClick={() => onDeleteQuestion(q.id)}
                disabled={questions.length === 1 || isProcessing}
                className="relative group flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="pl-11">
              {q.type === "short_answer" ? (
                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-sm">
                  <MessageSquare size={20} className="mb-2 opacity-50" />
                  <span>Short/Long Answer mode coming soon...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {q.choices.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3 group">
                      <button
                        onClick={() => onSetCorrectAnswer(q.id, optIndex)}
                        disabled={isProcessing}
                        className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                      >
                        {q.correct_index === optIndex ? (
                          <CheckCircle2
                            size={20}
                            className="text-green-500 fill-green-100 dark:fill-green-900"
                          />
                        ) : (
                          <Circle
                            size={20}
                            className="text-slate-300 dark:text-slate-600 hover:text-green-400 transition-colors"
                          />
                        )}
                      </button>

                      <input
                        type="text"
                        disabled={isProcessing}
                        placeholder={`Option ${optIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          onUpdateOptionText(q.id, optIndex, e.target.value)
                        }
                        className={`placeholder-slate-400 flex-grow px-3 py-2 rounded-lg text-sm text-black dark:text-slate-100 border bg-white dark:bg-slate-800 disabled:opacity-50 outline-none ${getBorderClasses(!!manualError && !opt.trim())}`}
                      />
                      {q.choices.length > 2 && (
                        <button
                          onClick={() => onRemoveOption(q.id, optIndex)}
                          disabled={isProcessing}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-opacity disabled:opacity-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {q.choices.length < 5 && (
                    <button
                      onClick={() => onAddOption(q.id)}
                      disabled={isProcessing}
                      className="ml-7 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mt-2 disabled:opacity-50 disabled:no-underline"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddQuestion}
        disabled={isProcessing}
        className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium hover:border-violet-300 dark:hover:border-slate-500 hover:text-violet-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} />
        Add Question
      </button>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
        <DurationSelect
          value={duration}
          isProcessing={isProcessing}
          onChange={onDurationChange}
        />
      </div>
    </div>
  );
}
