"use client";

import ActiveQuizView from "./components/ActiveQuizView";
import QuizStartScreen from "./components/QuizStartScreen";
import QuizSummaryScreen from "./components/QuizSummaryScreen";
import { useQuizActiveSession } from "./hooks/useQuizActiveSession";
import type { QuizActiveModalProps } from "./types";

export default function QuizActiveModal(props: QuizActiveModalProps) {
  const session = useQuizActiveSession(props);

  if (!session.hasStarted) {
    return (
      <QuizStartScreen
        quizTitle={session.quizTitle}
        questions={session.questions}
        duration={session.duration}
        onExit={session.onExit}
        onStart={session.handleStart}
      />
    );
  }

  if (session.isFinished) {
    return (
      <QuizSummaryScreen
        questions={session.questions}
        selectedAnswers={session.selectedAnswers}
        timeLeft={session.timeLeft}
        onJump={session.jumpToQuestion}
        onBackToQuiz={session.handleBackToQuiz}
        onSubmit={session.handleSubmit}
      />
    );
  }

  return (
    <ActiveQuizView
      questions={session.questions}
      currentQuestionIndex={session.currentQuestionIndex}
      currentQuestion={session.currentQuestion}
      selectedAnswers={session.selectedAnswers}
      isSubmitted={session.isSubmitted}
      timeLeft={session.timeLeft}
      score={session.score}
      mounted={session.mounted}
      isMobileNavOpen={session.isMobileNavOpen}
      isExitConfirmOpen={session.isExitConfirmOpen}
      isTimeUpOpen={session.isTimeUpOpen}
      setIsMobileNavOpen={session.setIsMobileNavOpen}
      setIsExitConfirmOpen={session.setIsExitConfirmOpen}
      setIsTimeUpOpen={session.setIsTimeUpOpen}
      onOptionSelect={session.handleOptionSelect}
      onPrev={session.handlePrev}
      onNext={session.handleNext}
      onExitClick={session.handleExitClick}
      onJump={session.jumpToQuestion}
      onConfirmExit={session.confirmExit}
    />
  );
}
