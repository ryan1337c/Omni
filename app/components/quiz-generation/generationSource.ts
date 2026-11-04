import { checkDocumentFile } from "@/lib/quiz/documentRules";

export type GenerationSource = "fromScratch" | "notes";

export type GenerationSourceInputs = {
  fromScratch: { text: string };
  notes: { file: File | null; focus: string };
};

export type GenerationSourceState = {
  selected: GenerationSource;
  inputs: GenerationSourceInputs;
};

export const initialGenerationSourceState: GenerationSourceState = {
  selected: "fromScratch",
  inputs: {
    fromScratch: { text: "" },
    notes: { file: null, focus: "" },
  },
};

export type GenerationSourceAction =
  | { type: "select"; source: GenerationSource }
  | {
      [S in GenerationSource]: {
        type: "updateInputs";
        source: S;
        inputs: Partial<GenerationSourceInputs[S]>;
      };
    }[GenerationSource]
  | { type: "reset" };

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
      return state.inputs.fromScratch.text.trim()
        ? undefined
        : "Please enter a topic.";
    case "notes":
      return validateDocument(state.inputs.notes.file);
  }
}

function validateDocument(file: File | null): string | undefined {
  return file ? checkDocumentFile(file) : "Please upload a PDF or DOCX file.";
}
