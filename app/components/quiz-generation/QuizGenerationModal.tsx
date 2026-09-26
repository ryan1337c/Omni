"use client";

import {
  ClearConfirmOverlay,
  DescriptionField,
  GenerationModalFooter,
  GenerationModalShell,
  ModeSelector,
  TitleField,
} from "@/app/components/shared/generation";

import ManualQuestionsEditor from "./components/ManualQuestionsEditor";
import QuizAiFields from "./components/QuizAiFields";
import { useQuizGeneration } from "./hooks/useQuizGeneration";
import type { QuizGenerationModalProps } from "./types";

export default function QuizGenerationModal(props: QuizGenerationModalProps) {
  const quiz = useQuizGeneration(props);

  if (!props.isOpen) return null;

  return (
    <GenerationModalShell
      title={quiz.editMode ? "Edit Quiz" : "Create New Quiz"}
      isProcessing={props.isProcessing}
      processingLabel="Generating Quiz..."
      onClose={quiz.handleClose}
      serverError={quiz.serverError}
      showUpgradeCta={quiz.showUpgradeCta}
      onDismissError={quiz.dismissServerError}
      footer={
        <GenerationModalFooter
          isProcessing={props.isProcessing}
          editMode={quiz.editMode}
          generateLabel="Generate Quiz"
          onCancel={quiz.handleClose}
          onSubmit={quiz.handleGenerate}
        />
      }
      overlay={
        quiz.isClearConfirmOpen ? (
          <ClearConfirmOverlay
            title="Clear all questions?"
            description="This will permanently delete all your questions. This action cannot be undone."
            onCancel={() => quiz.setIsClearConfirmOpen(false)}
            onConfirm={quiz.confirmClearAll}
          />
        ) : null
      }
    >
      <TitleField
        label="Quiz Title"
        placeholder="e.g., Advanced Biology Finals"
        value={quiz.title}
        error={quiz.formErrors.title}
        isProcessing={props.isProcessing}
        onChange={quiz.handleTitleChange}
      />

      <DescriptionField
        placeholder="Briefly describe what this quiz is about..."
        value={quiz.description}
        isProcessing={props.isProcessing}
        onChange={quiz.setDescription}
      />

      {!quiz.editMode && (
        <ModeSelector
          mode={quiz.mode}
          isProcessing={props.isProcessing}
          aiDescription="Auto-generated questions"
          onChange={quiz.handleModeChange}
        />
      )}

      {quiz.mode === "manual" ? (
        <ManualQuestionsEditor
          questions={quiz.questions}
          manualError={quiz.formErrors.manual}
          isProcessing={props.isProcessing}
          duration={quiz.duration}
          onClearAll={quiz.handleClearAllClick}
          onAddQuestion={quiz.addQuestion}
          onDeleteQuestion={quiz.deleteQuestion}
          onUpdateQuestionText={quiz.updateQuestionText}
          onUpdateQuestionType={quiz.updateQuestionType}
          onSetCorrectAnswer={quiz.setCorrectAnswer}
          onAddOption={quiz.addOption}
          onRemoveOption={quiz.removeOption}
          onUpdateOptionText={quiz.updateOptionText}
          onDurationChange={quiz.setDuration}
        />
      ) : (
        <QuizAiFields
          topic={quiz.topic}
          topicError={quiz.formErrors.topic}
          questionCount={quiz.questionCount}
          duration={quiz.duration}
          isProcessing={props.isProcessing}
          onTopicChange={quiz.handleTopicChange}
          onQuestionCountChange={quiz.setQuestionCount}
          onQuestionCountBlur={quiz.handleQuestionCountBlur}
          onDurationChange={quiz.setDuration}
        />
      )}
    </GenerationModalShell>
  );
}
