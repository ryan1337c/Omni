"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import type { FormErrors } from "@/app/components/shared/generation/types";
import { checkFigureFiles } from "@/lib/quiz/figureRules";

import { QUESTION_LIMIT } from "../constants";
import type { FigureDraft, ManualQuestion } from "../types";

const emptyQuestion = (id = "1"): ManualQuestion => ({
  id,
  question_text: "",
  type: "multiple_choice",
  choices: ["", ""],
  correct_index: 0,
  explanation: "",
  figures: [],
});

function releasePreviews(figures: FigureDraft[]) {
  for (const figure of figures) {
    if (figure.kind === "picked") URL.revokeObjectURL(figure.previewUrl);
  }
}

export function useManualQuestions(
  setFormErrors: Dispatch<SetStateAction<FormErrors>>,
) {
  const [questions, setQuestions] = useState<ManualQuestion[]>([
    emptyQuestion(),
  ]);

  const resetQuestions = () => {
    releasePreviews(questions.flatMap((q) => q.figures));
    setQuestions([emptyQuestion()]);
  };

  const addQuestion = () => {
    if (questions.length === QUESTION_LIMIT) return;
    setQuestions([
      ...questions,
      emptyQuestion(Date.now().toString()),
    ]);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    releasePreviews(questions.find((q) => q.id === id)?.figures ?? []);
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const shouldConfirmClear = () => {
    return (
      questions.length > 1 ||
      questions[0].question_text.trim() !== "" ||
      questions[0].choices.length > 2 ||
      questions[0].figures.length > 0
    );
  };

  const confirmClearAll = () => {
    releasePreviews(questions.flatMap((q) => q.figures));
    setQuestions([emptyQuestion(Date.now().toString())]);
    setFormErrors((prev) => ({ ...prev, manual: undefined }));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question_text: text } : q)),
    );
    if (text.trim()) setFormErrors((prev) => ({ ...prev, manual: undefined }));
  };

  const updateQuestionType = (
    id: string,
    type: "multiple_choice" | "short_answer",
  ) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, type } : q)));
  };

  const setCorrectAnswer = (qId: string, index: number) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, correct_index: index } : q)),
    );
  };

  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId && q.choices.length < 5)
          return { ...q, choices: [...q.choices, ""] };
        return q;
      }),
    );
  };

  const removeOption = (qId: string, idx: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId && q.choices.length > 2) {
          const newOpts = [...q.choices];
          newOpts.splice(idx, 1);
          let newAnswerIdx = q.correct_index;
          if (q.correct_index === idx) newAnswerIdx = 0;
          else if (q.correct_index > idx) newAnswerIdx = q.correct_index - 1;
          return { ...q, choices: newOpts, correct_index: newAnswerIdx };
        }
        return q;
      }),
    );
  };

  const updateOptionText = (qId: string, idx: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.choices];
          newOpts[idx] = text;
          return { ...q, choices: newOpts };
        }
        return q;
      }),
    );
    if (text.trim()) setFormErrors((prev) => ({ ...prev, manual: undefined }));
  };

  const updateExplanation = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, explanation: text } : q)),
    );
  };

  /** Adds picked pictures as Figures, or returns why they can't be added. */
  const addFigures = (id: string, files: File[]): string | undefined => {
    const question = questions.find((q) => q.id === id);
    if (!question) return undefined;
    const error = checkFigureFiles(files, question.figures.length);
    if (error) return error;

    const picked: FigureDraft[] = files.map((file) => ({
      kind: "picked",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, figures: [...q.figures, ...picked] } : q,
      ),
    );
    return undefined;
  };

  const removeFigure = (id: string, index: number) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    releasePreviews([question.figures[index]]);
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, figures: q.figures.filter((_, i) => i !== index) }
          : q,
      ),
    );
  };

  return {
    questions,
    setQuestions,
    resetQuestions,
    addQuestion,
    deleteQuestion,
    shouldConfirmClear,
    confirmClearAll,
    updateQuestionText,
    updateQuestionType,
    setCorrectAnswer,
    addOption,
    removeOption,
    updateOptionText,
    updateExplanation,
    addFigures,
    removeFigure,
  };
}
