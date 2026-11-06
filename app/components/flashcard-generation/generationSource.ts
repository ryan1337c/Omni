import { checkDocumentFile, UPLOAD_DOCUMENT_MESSAGE } from "@/lib/quiz/documentRules";
import type { GenerationSourceKind } from "@/lib/flashcards/generationSourceKinds";

export type GenerationSourceState = {
  selected: GenerationSourceKind;
  inputs: {
    fromScratch: { text: string };
    notes: { file: File | null; focus: string };
  };
};

export const initialGenerationSourceState: GenerationSourceState = {
  selected: "fromScratch",
  inputs: {
    fromScratch: { text: "" },
    notes: { file: null, focus: "" },
  },
};

export type GenerationSourceAction =
  | { type: "select"; source: GenerationSourceKind }
  | {
      [S in GenerationSourceKind]: {
        type: "updateInputs";
        source: S;
        inputs: Partial<GenerationSourceState["inputs"][S]>;
      };
    }[GenerationSourceKind]
  | { type: "reset" };

export function updateInputs<S extends GenerationSourceKind>(
  source: S,
  inputs: Partial<GenerationSourceState["inputs"][S]>,
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

export function validateGenerationSource(
  state: GenerationSourceState,
): string | undefined {
  switch (state.selected) {
    case "fromScratch":
      return state.inputs.fromScratch.text.trim() ? undefined : "Please enter a topic.";
    case "notes":
      return state.inputs.notes.file
        ? checkDocumentFile(state.inputs.notes.file)
        : UPLOAD_DOCUMENT_MESSAGE;
  }
}
