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
  nextSourceError,
  validateGenerationSource,
  type GenerationSourceAction,
} from "../generationSource";
import { toManualQuestion, type SavedQuestion } from "../manualQuestion";
import type { ManualQuestion, QuizGenerationModalProps } from "../types";
import { useManualQuestions } from "./useManualQuestions";
import { MAX_TITLE_LENGTH } from "@/app/components/flashcards-view/constants";

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
    resetForm();
    onClose();
  };

  const withStoredFigures = async (manualQuestions: ManualQuestion[]) => {
    const uploaded: string[] = [];
    try {
      const saved = [];
      for (const question of manualQuestions) {
        const picked = question.figures.flatMap((figure) =>
          figure.kind === "picked" ? [figure.file] : [],
        );
        const pickedPaths = await publicServices.uploadQuizFigures(userId, picked);
        uploaded.push(...pickedPaths);
        let nextPicked = 0;
        saved.push({
          ...question,
          figure_paths: question.figures.map((figure) =>
            figure.kind === "stored" ? figure.path : pickedPaths[nextPicked++],
          ),
        });
      }
      return { saved, uploaded };
    } catch (error) {
      await publicServices.removeQuizFigures(uploaded);
      throw error;
    }
  };

  const undoUploadsIfFails = async <T,>(newPaths: string[], save: () => Promise<T>) => {
    try {
      return await save();
    } catch (error) {
      await publicServices.removeQuizFigures(newPaths);
      throw error;
    }
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
    } else if (form.title.trim().length > MAX_TITLE_LENGTH) {
      newErrors.title = `Quiz title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
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

        const { saved, uploaded } = await withStoredFigures(questions.questions);
        const updatedQuiz = await undoUploadsIfFails(uploaded, () =>
          publicServices.updateQuiz(
            initialData.id,
            form.title,
            form.description,
            Number(duration),
            saved,
          ),
        );

        const kept = new Set(saved.flatMap((q) => q.figure_paths));
        const before: string[] = (initialData.questions ?? []).flatMap(
          (q: SavedQuestion) => (q.figures ?? []).map((figure) => figure.path),
        );
        await publicServices.removeQuizFigures(
          before.filter((path) => !kept.has(path)),
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

          const generatedPaths: string[] = data.quiz.flatMap(
            (q: { figure_paths: string[] }) => q.figure_paths,
          );
          const quiz = await undoUploadsIfFails(generatedPaths, () =>
            publicServices.createQuiz(
              form.title,
              userId,
              form.mode,
              Number(duration),
              data.quiz.length,
              form.description,
              data.quiz,
            ),
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
          const { saved, uploaded } = await withStoredFigures(questions.questions);
          const quiz = await undoUploadsIfFails(uploaded, () =>
            publicServices.createQuiz(
              form.title,
              userId,
              form.mode,
              Number(duration),
              saved.length,
              form.description,
              saved,
            ),
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
    form.setFormErrors((prev) => ({
      ...prev,
      source: nextSourceError(prev.source, action, next),
    }));
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
