"use client";

import { CountField, TopicField } from "@/app/components/shared/generation";

type FlashcardAiFieldsProps = {
  topic: string;
  topicError?: string;
  cardCount: number | string;
  isProcessing: boolean;
  onTopicChange: (value: string) => void;
  onCardCountChange: (value: string) => void;
  onCardCountBlur: () => void;
};

export default function FlashcardAiFields({
  topic,
  topicError,
  cardCount,
  isProcessing,
  onTopicChange,
  onCardCountChange,
  onCardCountBlur,
}: FlashcardAiFieldsProps) {
  return (
    <div className="space-y-6 animate-fade-in-sm">
      <TopicField
        label="Topic or Text"
        placeholder="Enter a topic, paste notes, or describe what you want to study..."
        rows={6}
        value={topic}
        error={topicError}
        isProcessing={isProcessing}
        onChange={onTopicChange}
      />

      <CountField
        label="Number of Cards"
        hint="(5-50)"
        min={5}
        max={50}
        value={cardCount}
        isProcessing={isProcessing}
        hintClassName="text-slate-600 dark:text-slate-400 text-xs font-normal ml-auto"
        onChange={onCardCountChange}
        onBlur={onCardCountBlur}
      />
    </div>
  );
}
