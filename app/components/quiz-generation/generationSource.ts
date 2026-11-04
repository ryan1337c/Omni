import { MAX_CONTEXT_CHARS } from "@/lib/credits/contextMeter";
import { checkDocumentFile, UPLOAD_DOCUMENT_MESSAGE } from "@/lib/quiz/documentRules";
import { TEXT_TOO_LONG_MESSAGE } from "@/lib/quiz/errors";
import type { GenerationSourceKind } from "@/lib/quiz/generationSourceKinds";

export type GenerationSourceInputs = {
  fromScratch: { text: string };
  notes: { file: File | null; focus: string };
  sampleTest: { file: File | null };
};

export type GenerationSourceState = {
  selected: GenerationSourceKind;
  inputs: { [S in GenerationSourceKind]: GenerationSourceInputs[S] };
};

export const initialGenerationSourceState: GenerationSourceState = {
  selected: "fromScratch",
  inputs: {
    fromScratch: { text: "" },
    notes: { file: null, focus: "" },
    sampleTest: { file: null },
  },
};

export type GenerationSourceAction =
  | { type: "select"; source: GenerationSourceKind }
  | {
      [S in GenerationSourceKind]: {
        type: "updateInputs";
        source: S;
        inputs: Partial<GenerationSourceInputs[S]>;
      };
    }[GenerationSourceKind]
  | { type: "reset" };

export function updateInputs<S extends GenerationSourceKind>(
  source: S,
  inputs: Partial<GenerationSourceInputs[S]>,
): GenerationSourceAction {
  return { type: "updateInputs", source, inputs } as GenerationSourceAction;
}

export function generationSourceReducer(
  state: GenerationSourceState,
  action: GenerationSourceAction,
): GenerationSourceState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.source };
    case "updateInputs":
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.source]: { ...state.inputs[action.source], ...action.inputs },
        },
      };
    case "reset":
      return initialGenerationSourceState;
  }
}

export function validateGenerationSource(
  state: GenerationSourceState,
): string | undefined {
  switch (state.selected) {
    case "fromScratch":
      return validateFromScratchText(state.inputs.fromScratch.text);
    case "notes":
      return validateDocument(state.inputs.notes.file);
    case "sampleTest":
      return validateDocument(state.inputs.sampleTest.file);
  }
}

/**
 * The source error to show after `action` produced `next`: a chosen file's
 * problem shows at once, a fixed or switched source clears it, and anything
 * else waits for submit.
 */
export function nextSourceError(
  current: string | undefined,
  action: GenerationSourceAction,
  next: GenerationSourceState,
): string | undefined {
  const error = validateGenerationSource(next);
  if (action.type === "select" || !error) {
    return undefined;
  }
  if (action.type === "updateInputs" && "file" in action.inputs && action.inputs.file) {
    return error;
  }
  return current;
}

/** Sample Test takes its Number of Questions from the document. */
export function usesQuestionCount(source: GenerationSourceKind): boolean {
  return source !== "sampleTest";
}

function validateFromScratchText(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Please enter a topic.";
  }
  return trimmed.length > MAX_CONTEXT_CHARS ? TEXT_TOO_LONG_MESSAGE : undefined;
}

function validateDocument(file: File | null): string | undefined {
  return file ? checkDocumentFile(file) : UPLOAD_DOCUMENT_MESSAGE;
}
