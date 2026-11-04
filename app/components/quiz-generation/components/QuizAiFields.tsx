"use client";

import { CountField } from "@/app/components/shared/generation";

import type {
  GenerationSourceAction,
  GenerationSourceState,
} from "../generationSource";
import DurationSelect from "./DurationSelect";
import FromScratchPanel from "./FromScratchPanel";
import GenerationSourcePicker from "./GenerationSourcePicker";

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
      </div>

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
