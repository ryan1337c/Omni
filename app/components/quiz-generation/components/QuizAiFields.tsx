"use client";

import { CountField, TopicField } from "@/app/components/shared/generation";

import DurationSelect from "./DurationSelect";

type QuizAiFieldsProps = {
  topic: string;
  topicError?: string;
  questionCount: number | string;
  duration: string;
  isProcessing: boolean;
  onTopicChange: (value: string) => void;
  onQuestionCountChange: (value: string) => void;
  onQuestionCountBlur: () => void;
  onDurationChange: (value: string) => void;
};

export default function QuizAiFields({
  topic,
  topicError,
  questionCount,
  duration,
  isProcessing,
  onTopicChange,
  onQuestionCountChange,
  onQuestionCountBlur,
  onDurationChange,
}: QuizAiFieldsProps) {
  return (
    <div className="space-y-6 animate-fade-in-sm">
      <TopicField
        label="Topic & Style"
        placeholder="Enter topic, difficulty, or style here (e.g., 'Calculus integrals, hard difficulty, focus on real-world applications')"
        rows={3}
        value={topic}
        error={topicError}
        isProcessing={isProcessing}
        onChange={onTopicChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountField
          label="Number of Questions"
          hint="(1-50)"
          min={1}
          max={50}
          value={questionCount}
          isProcessing={isProcessing}
          onChange={onQuestionCountChange}
          onBlur={onQuestionCountBlur}
        />
        <DurationSelect
          value={duration}
          isProcessing={isProcessing}
          onChange={onDurationChange}
        />
      </div>
    </div>
  );
}
