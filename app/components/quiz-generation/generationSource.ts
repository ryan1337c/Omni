export type GenerationSource = "fromScratch";

export type GenerationSourceInputs = {
  fromScratch: { text: string };
};

export type GenerationSourceState = {
  selected: GenerationSource;
  inputs: GenerationSourceInputs;
};

export const initialGenerationSourceState: GenerationSourceState = {
  selected: "fromScratch",
  inputs: {
    fromScratch: { text: "" },
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
  }
}
