"use client";

import { useEffect, useState } from "react";

import { STORAGE_KEY } from "../constants";
import { calculateScore } from "../utils";
import type { QuizActiveModalProps } from "../types";

export function useQuizActiveSession({
  quizId,
  quizTitle,
  questions,
  duration,
  onExit,
}: QuizActiveModalProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {}
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(duration);

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isTimeUpOpen, setIsTimeUpOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (String(parsed.quizId) === String(quizId)) {
          setHasStarted(parsed.hasStarted);
          setIsFinished(parsed.isFinished);
          setIsSubmitted(parsed.isSubmitted || false);
          setCurrentQuestionIndex(parsed.currentQuestionIndex);
          setSelectedAnswers(parsed.selectedAnswers);

          if (parsed.endTime) {
            setEndTime(parsed.endTime);
            const secondsRemaining = Math.floor(
              (parsed.endTime - Date.now()) / 1000
            );
            setTimeLeft(secondsRemaining > 0 ? secondsRemaining : 0);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [quizId]);

  useEffect(() => {
    if (hasStarted) {
      const stateToSave = {
        quizId,
        quizTitle,
        hasStarted,
        isFinished,
        isSubmitted,
        currentQuestionIndex,
        selectedAnswers,
        endTime,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [
    hasStarted,
    isFinished,
    isSubmitted,
    currentQuestionIndex,
    selectedAnswers,
    endTime,
    quizId,
    quizTitle,
  ]);

  const handleAutoSubmit = () => {
    setIsFinished(false);
    setIsSubmitted(true);
    setCurrentQuestionIndex(0);
    setIsExitConfirmOpen(false);
    setIsTimeUpOpen(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        if (endTime) {
          const now = Date.now();
          const diff = Math.floor((endTime - now) / 1000);
          if (diff <= 0) {
            setTimeLeft(0);
            handleAutoSubmit();
          } else {
            setTimeLeft(diff);
          }
        } else {
          setTimeLeft((prev) => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, timeLeft, endTime]);

  const handleStart = () => {
    setHasStarted(true);
    const target = Date.now() + duration * 1000;
    setEndTime(target);
    const newState = {
      quizId,
      quizTitle,
      hasStarted: true,
      isFinished: false,
      isSubmitted: false,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      endTime: target,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const confirmExit = () => {
    setIsExitConfirmOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    onExit();
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      if (isSubmitted) confirmExit();
      else setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsFinished(false);
    setIsMobileNavOpen(false);
  };

  const handleBackToQuiz = () => {
    setCurrentQuestionIndex(questions.length - 1);
    setIsFinished(false);
  };

  const handleSubmit = () => {
    setIsFinished(false);
    setIsSubmitted(true);
    setCurrentQuestionIndex(0);
  };

  const handleExitClick = () => {
    if (isSubmitted) confirmExit();
    else setIsExitConfirmOpen(true);
  };

  const score = calculateScore(questions, selectedAnswers);
  const currentQuestion = questions[currentQuestionIndex];

  return {
    hasStarted,
    isFinished,
    isSubmitted,
    currentQuestionIndex,
    selectedAnswers,
    isMobileNavOpen,
    setIsMobileNavOpen,
    timeLeft,
    isExitConfirmOpen,
    setIsExitConfirmOpen,
    isTimeUpOpen,
    setIsTimeUpOpen,
    mounted,
    handleStart,
    handleOptionSelect,
    handleNext,
    handlePrev,
    jumpToQuestion,
    handleBackToQuiz,
    handleSubmit,
    handleExitClick,
    confirmExit,
    score,
    currentQuestion,
    duration,
    quizTitle,
    questions,
    onExit,
  };
}
