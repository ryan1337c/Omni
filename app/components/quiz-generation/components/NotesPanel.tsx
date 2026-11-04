"use client";

import { TopicField } from "@/app/components/shared/generation";

import DocumentDropzone from "./DocumentDropzone";

type NotesPanelProps = {
  file: File | null;
  focus: string;
  error?: string;
  isProcessing: boolean;
  onFileChange: (file: File | null) => void;
  onFocusChange: (value: string) => void;
};

export default function NotesPanel({
  file,
  focus,
  error,
  isProcessing,
  onFileChange,
  onFocusChange,
}: NotesPanelProps) {
  return (
    <div className="space-y-4">
      <DocumentDropzone
        label="Notes"
        file={file}
        error={error}
        isProcessing={isProcessing}
        onFileChange={onFileChange}
      />
      <TopicField
        label="Focus or style"
        placeholder="e.g., 'Only chapter 3, hard difficulty'"
        rows={2}
        value={focus}
        required={false}
        isProcessing={isProcessing}
        onChange={onFocusChange}
      />
    </div>
  );
}
