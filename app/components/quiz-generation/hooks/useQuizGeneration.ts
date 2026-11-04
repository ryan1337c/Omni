"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/app/context/AuthContext";
import { useGenerationForm } from "@/app/hooks/useGenerationForm";
import { clampCount } from "@/app/components/shared/generation/utils";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";

import { generateQuizRequest } from "../api";
import {
  generationSourceReducer,
  initialGenerationSourceState,
  validateGenerationSource,
  type GenerationSourceAction,
} from "../generationSource";
import { toManualQuestion } from "../manualQuestion";
import type { QuizGenerationModalProps } from "../types";
import { useManualQuestions } from "./useManualQuestions";

export function useQuizGeneration({
  isOpen,
  onClose,
  setIsProcessing,
  onQuizCreated,
  editMode = false,
  initialData,
  onQuizUpdated,
}: QuizGenerationModalProps) {
  const { tier } = useAuth();
  const form = useGenerationForm();
  const questions = useManualQuestions(form.setFormErrors);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | string>(10);
  const [duration, setDuration] = useState("600");
  const [generationSource, setGenerationSource] = useState(
    initialGenerationSourceState,
  );

  const authServices = new AuthServices();
  const publicServices = new PublicServices();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await authServices.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error: any) {
        console.error("Error fetching session", error);
      }
    };
    fetchSession();
  }, []);

  const resetForm = () => {
    form.setTitle("");
    form.setDescription("");
    form.setMode("ai");
    setGenerationSource(initialGenerationSourceState);
    setQuestionCount(10);
    setDuration("600");
    questions.resetQuestions();
    form.setFormErrors({});
    form.setIsClearConfirmOpen(false);
  };

  const handleClose = () => {
    form.setTitle("");
    form.setDescription("");
    form.setMode("ai");
    setGenerationSource(initialGenerationSourceState);
    setQuestionCount(10);
    setDuration("600");
    questions.resetQuestions();
    form.setFormErrors({});
    form.setIsClearConfirmOpen(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && editMode && initialData) {
      form.setMode("manual");
      form.setTitle(initialData.title);
      form.setDescription(initialData.description || "");
      setDuration(String(initialData.duration));
      setQuestionCount(initialData.count);

      if (initialData.questions) {
        questions.setQuestions(initialData.questions.map(toManualQuestion));
      }
    } else if (isOpen && !editMode) {
      resetForm();
    }
  }, [isOpen, editMode, initialData]);

  const handleGenerate = async () => {
    form.beginSubmit();

    const newErrors: typeof form.formErrors = {};
    let hasError = false;

    if (!form.title.trim()) {
      newErrors.title = "Please enter a quiz title.";
      hasError = true;
    }

    if (form.mode === "ai") {
      const sourceError = validateGenerationSource(generationSource);
      if (sourceError) {
        newErrors.source = sourceError;
        hasError = true;
      }
    } else {
      const invalidQuestions = questions.questions.some(
        (q) => !q.question_text.trim(),
      );
      const invalidOptions = questions.questions.some(
        (q) =>
          q.type === "multiple_choice" && q.choices.some((opt) => !opt.trim()),
      );

      if (invalidQuestions || invalidOptions) {
        newErrors.manual = "Please fill out all question text and choice fields.";
        hasError = true;
      }
    }

    if (hasError) {
      form.setFormErrors(newErrors);
      return;
    }

    if (editMode) {
      try {
        setIsProcessing(true);

        const updatedQuiz = await publicServices.updateQuiz(
          initialData.id,
          form.title,
          form.description,
          Number(duration),
          questions.questions,
        );

        onQuizUpdated(updatedQuiz);
        handleClose();
      } catch (e) {
        console.error(e);
        form.setServerError("An unexpected error occurred. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (form.mode === "ai") {
        setIsProcessing(true);
        try {
          const { result, data } = await generateQuizRequest(
            form.title,
            generationSource,
            questionCount,
          );

          if (!result.ok) {
            if (form.applyCreditError(result.status, data, tier)) {
              return;
            }
            throw new Error(data.error || "Something went wrong!");
          }

          const quiz = await publicServices.createQuiz(
            form.title,
            userId,
            form.mode,
            Number(duration),
            Number(questionCount),
            form.description,
            data.quiz,
          );

          onQuizCreated(quiz);
          handleClose();
        } catch (error: any) {
          console.log(`generate quiz error ${error}`);
          form.setServerError(
            error.message || "An unexpected error occurred. Please try again.",
          );
        } finally {
          setIsProcessing(false);
        }
      } else {
        try {
          setIsProcessing(true);
          const quiz = await publicServices.createQuiz(
            form.title,
            userId,
            form.mode,
            Number(duration),
            questions.questions.length,
            form.description,
            questions.questions,
          );

          onQuizCreated(quiz);
          handleClose();
        } catch (error) {
          console.error(error);
          form.setServerError("An unexpected error occurred. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const handleGenerationSourceChange = (action: GenerationSourceAction) => {
    const next = generationSourceReducer(generationSource, action);
    setGenerationSource(next);
    const sourceError = validateGenerationSource(next);
    if (action.type === "select" || !sourceError) {
      form.setFormErrors((prev) => ({ ...prev, source: undefined }));
    } else if (action.type === "updateInputs" && "file" in action.inputs && action.inputs.file) {
      form.setFormErrors((prev) => ({ ...prev, source: sourceError }));
    }
  };

  const handleQuestionCountBlur = () => {
    setQuestionCount(clampCount(questionCount, 1, 50));
  };

  const handleClearAllClick = () => {
    if (questions.shouldConfirmClear()) {
      form.setIsClearConfirmOpen(true);
    }
  };

  const confirmClearAll = () => {
    questions.confirmClearAll();
    form.setIsClearConfirmOpen(false);
  };

  return {
    ...form,
    ...questions,
    editMode,
    generationSource,
    handleGenerationSourceChange,
    questionCount,
    setQuestionCount,
    duration,
    setDuration,
    handleClose,
    handleGenerate,
    handleQuestionCountBlur,
    handleClearAllClick,
    confirmClearAll,
  };
}
