"use client";

import { TopicField } from "@/app/components/shared/generation";

type FromScratchPanelProps = {
  text: string;
  error?: string;
  isProcessing: boolean;
  onTextChange: (value: string) => void;
};

export default function FromScratchPanel({
  text,
  error,
  isProcessing,
  onTextChange,
}: FromScratchPanelProps) {
  return (
    <TopicField
      label="Topic, difficulty, or style"
      placeholder="Enter topic, difficulty, or style here (e.g., 'Calculus integrals, hard difficulty, focus on real-world applications')"
      rows={3}
      value={text}
      error={error}
      allowOverLimit
      isProcessing={isProcessing}
      onChange={onTextChange}
    />
  );
}
