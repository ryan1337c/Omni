"use client";

import { CountField } from "@/app/components/shared/generation";

import {
  usesQuestionCount,
  type GenerationSourceAction,
  type GenerationSourceState,
} from "../generationSource";
import DocumentDropzone from "./DocumentDropzone";
import DurationSelect from "./DurationSelect";
import FromScratchPanel from "./FromScratchPanel";
import GenerationSourcePicker from "./GenerationSourcePicker";
import NotesPanel from "./NotesPanel";

type QuizAiFieldsProps = {
  generationSource: GenerationSourceState;
  sourceError?: string;
  questionCount: number | string;
  duration: string;
  isProcessing: boolean;
  onGenerationSourceChange: (action: GenerationSourceAction) => void;
  onQuestionCountChange: (value: string) => void;
  onQuestionCountBlur: () => void;
  onDurationChange: (value: string) => void;
};

export default function QuizAiFields({
  generationSource,
  sourceError,
  questionCount,
  duration,
  isProcessing,
  onGenerationSourceChange,
  onQuestionCountChange,
  onQuestionCountBlur,
  onDurationChange,
}: QuizAiFieldsProps) {
  const { selected, inputs } = generationSource;

  return (
    <div className="space-y-6 animate-fade-in-sm">
      <div className="space-y-4">
        <GenerationSourcePicker
          selected={selected}
          isProcessing={isProcessing}
          onSelect={(source) =>
            onGenerationSourceChange({ type: "select", source })
          }
        />

        {selected === "fromScratch" && (
          <FromScratchPanel
            text={inputs.fromScratch.text}
            error={sourceError}
            isProcessing={isProcessing}
            onTextChange={(text) =>
              onGenerationSourceChange({
                type: "updateInputs",
                source: "fromScratch",
                inputs: { text },
              })
            }
          />
        )}

        {selected === "notes" && (
          <NotesPanel
            file={inputs.notes.file}
            focus={inputs.notes.focus}
            error={sourceError}
            isProcessing={isProcessing}
            onFileChange={(file) =>
              onGenerationSourceChange({
                type: "updateInputs",
                source: "notes",
                inputs: { file },
              })
            }
            onFocusChange={(focus) =>
              onGenerationSourceChange({
                type: "updateInputs",
                source: "notes",
                inputs: { focus },
              })
            }
          />
        )}

        {selected === "sampleTest" && (
          <DocumentDropzone
            label="Sample Test"
            file={inputs.sampleTest.file}
            error={sourceError}
            isProcessing={isProcessing}
            onFileChange={(file) =>
              onGenerationSourceChange({
                type: "updateInputs",
                source: "sampleTest",
                inputs: { file },
              })
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usesQuestionCount(selected) && (
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
        )}
        <DurationSelect
          value={duration}
          isProcessing={isProcessing}
          onChange={onDurationChange}
        />
      </div>
    </div>
  );
}
