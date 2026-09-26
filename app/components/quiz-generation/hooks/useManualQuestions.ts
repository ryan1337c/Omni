"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import type { FormErrors } from "@/app/components/shared/generation/types";

import { QUESTION_LIMIT } from "../constants";
import type { ManualQuestion } from "../types";

const emptyQuestion = (id = "1"): ManualQuestion => ({
  id,
  question_text: "",
  type: "multiple_choice",
  choices: ["", ""],
  correct_index: 0,
});

export function useManualQuestions(
  setFormErrors: Dispatch<SetStateAction<FormErrors>>,
) {
  const [questions, setQuestions] = useState<ManualQuestion[]>([
    emptyQuestion(),
  ]);

  const resetQuestions = () => {
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
    if (questions.length > 1) setQuestions(questions.filter((q) => q.id !== id));
  };

  const shouldConfirmClear = () => {
    return (
      questions.length > 1 ||
      questions[0].question_text.trim() !== "" ||
      questions[0].choices.length > 2
    );
  };

  const confirmClearAll = () => {
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
  };
}
