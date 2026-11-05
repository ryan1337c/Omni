"use client";

import {
  AlertTriangle,
  AlignLeft,
  CheckCircle2,
  Circle,
  Eraser,
  ImagePlus,
  ListChecks,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  INPUT_BASE_CLASSES,
  getBorderClasses,
} from "@/app/components/shared/generation";
import {
  FIGURE_ACCEPT,
  MAX_FIGURES_PER_QUESTION,
  figureNumberLabel,
} from "@/lib/quiz/figureRules";

import type { FigureDraft, ManualQuestion } from "../types";
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
  onUpdateExplanation: (id: string, text: string) => void;
  /** Returns why the pictures can't be added, if they can't. */
  onAddFigures: (id: string, files: File[]) => string | undefined;
  onRemoveFigure: (id: string, index: number) => void;
  onDurationChange: (value: string) => void;
};

function figureSrc(figure: FigureDraft) {
  return figure.kind === "stored" ? figure.url : figure.previewUrl;
}

function FigureField({
  figures,
  isProcessing,
  onAdd,
  onRemove,
}: {
  figures: FigureDraft[];
  isProcessing: boolean;
  onAdd: (files: File[]) => string | undefined;
  onRemove: (index: number) => void;
}) {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {figures.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {figures.map((figure, index) => (
            <div
              key={figureSrc(figure)}
              className="relative group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1"
            >
              <img
                src={figureSrc(figure)}
                alt={figureNumberLabel(index, figures.length) ?? "Figure"}
                className="h-20 w-full object-contain"
              />
              {figureNumberLabel(index, figures.length) && (
                <span className="absolute bottom-1 left-1 px-1.5 rounded bg-black/60 text-[10px] font-semibold text-white">
                  {figureNumberLabel(index, figures.length)}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  onRemove(index);
                  setError(undefined);
                }}
                disabled={isProcessing}
                className="absolute top-1 right-1 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-red-500 shadow-sm disabled:opacity-50"
                title="Remove figure"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {figures.length < MAX_FIGURES_PER_QUESTION && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          className="text-xs font-medium text-violet-600 dark:text-btnDark hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
        >
          <ImagePlus size={12} /> Add figure
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={FIGURE_ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) setError(onAdd(files));
        }}
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function ExplanationField({
  explanation,
  isProcessing,
  onChange,
}: {
  explanation: string;
  isProcessing: boolean;
  onChange: (text: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(() => !!explanation.trim());

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={isProcessing}
        className="ml-7 text-xs font-medium text-violet-600 dark:text-btnDark hover:underline flex items-center gap-1 mt-2 disabled:opacity-50 disabled:no-underline"
      >
        <Plus size={12} /> Add explanation
      </button>
    );
  }

  return (
    <div className="ml-7 mt-3 space-y-1.5">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Explanation (optional)
      </label>
      <textarea
        disabled={isProcessing}
        placeholder="Why is the correct Choice right?"
        value={explanation}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`${INPUT_BASE_CLASSES} text-sm bg-white dark:bg-slate-800 outline-none resize-none ${getBorderClasses(false)}`}
      />
    </div>
  );
}

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
  onUpdateExplanation,
  onAddFigures,
  onRemoveFigure,
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
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
          >
            <div className="flex gap-3 mb-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-btnDark/20 text-sm font-bold text-slate-600 dark:text-indigo-200">
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

                <FigureField
                  figures={q.figures}
                  isProcessing={isProcessing}
                  onAdd={(files) => onAddFigures(q.id, files)}
                  onRemove={(index) => onRemoveFigure(q.id, index)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateQuestionType(q.id, "multiple_choice")}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      q.type === "multiple_choice"
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-btnDark dark:text-white dark:border-btnDark"
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
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-btnDark dark:text-white dark:border-btnDark"
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
                      className="ml-7 text-xs font-medium text-violet-600 dark:text-btnDark hover:underline flex items-center gap-1 mt-2 disabled:opacity-50 disabled:no-underline"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  )}

                  <ExplanationField
                    explanation={q.explanation}
                    isProcessing={isProcessing}
                    onChange={(text) => onUpdateExplanation(q.id, text)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddQuestion}
        disabled={isProcessing}
        className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium hover:border-violet-300 dark:hover:border-btnDark hover:text-violet-600 dark:hover:text-indigo-200 hover:bg-slate-50 dark:hover:bg-btnDark/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
