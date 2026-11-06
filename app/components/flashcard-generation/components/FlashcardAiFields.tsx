"use client";

import { CountField, TopicField } from "@/app/components/shared/generation";
import NotesPanel from "@/app/components/quiz-generation/components/NotesPanel";

import {
  updateInputs,
  type GenerationSourceAction,
  type GenerationSourceState,
} from "../generationSource";
import GenerationSourcePicker from "./GenerationSourcePicker";

type FlashcardAiFieldsProps = {
  generationSource: GenerationSourceState;
  sourceError?: string;
  cardCount: number | string;
  isProcessing: boolean;
  onGenerationSourceChange: (action: GenerationSourceAction) => void;
  onCardCountChange: (value: string) => void;
  onCardCountBlur: () => void;
};

export default function FlashcardAiFields({
  generationSource,
  sourceError,
  cardCount,
  isProcessing,
  onGenerationSourceChange,
  onCardCountChange,
  onCardCountBlur,
}: FlashcardAiFieldsProps) {
  const { selected, inputs } = generationSource;

  return (
    <div className="space-y-6 animate-fade-in-sm">
      <div className="space-y-4">
        <GenerationSourcePicker
          selected={selected}
          isProcessing={isProcessing}
          onSelect={(source) => onGenerationSourceChange({ type: "select", source })}
        />

        {selected === "fromScratch" && (
          <TopicField
            label="Topic or Text"
            placeholder="Enter a topic, paste notes, or describe what you want to study..."
            rows={6}
            value={inputs.fromScratch.text}
            error={sourceError}
            isProcessing={isProcessing}
            onChange={(text) =>
              onGenerationSourceChange(updateInputs("fromScratch", { text }))
            }
          />
        )}

        {selected === "notes" && (
          <NotesPanel
            file={inputs.notes.file}
            focus={inputs.notes.focus}
            error={sourceError}
            isProcessing={isProcessing}
            onFileChange={(file) => onGenerationSourceChange(updateInputs("notes", { file }))}
            onFocusChange={(focus) => onGenerationSourceChange(updateInputs("notes", { focus }))}
          />
        )}
      </div>

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
