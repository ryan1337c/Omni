import { describe, expect, it } from "vitest";

import {
  generationSourceReducer,
  initialGenerationSourceState,
  validateGenerationSource,
} from "./generationSource";

describe("validateGenerationSource", () => {
  it("rejects From Scratch with an empty text box", () => {
    expect(validateGenerationSource(initialGenerationSourceState)).toBe(
      "Please enter a topic.",
    );
  });

  it("rejects From Scratch text that is only whitespace", () => {
    const state = generationSourceReducer(initialGenerationSourceState, {
      type: "updateInputs",
      source: "fromScratch",
      inputs: { text: "   \n " },
    });

    expect(validateGenerationSource(state)).toBe("Please enter a topic.");
  });

  it("accepts From Scratch once its text box is filled", () => {
    const state = generationSourceReducer(initialGenerationSourceState, {
      type: "updateInputs",
      source: "fromScratch",
      inputs: { text: "Calculus integrals, hard" },
    });

    expect(validateGenerationSource(state)).toBeUndefined();
  });
});

describe("generationSourceReducer", () => {
  it("starts with From Scratch selected", () => {
    expect(initialGenerationSourceState.selected).toBe("fromScratch");
  });

  it("stores the typed From Scratch text", () => {
    const state = generationSourceReducer(initialGenerationSourceState, {
      type: "updateInputs",
      source: "fromScratch",
      inputs: { text: "Cell biology" },
    });

    expect(state.inputs.fromScratch.text).toBe("Cell biology");
  });

  it("clears every source's inputs on reset", () => {
    const typed = generationSourceReducer(initialGenerationSourceState, {
      type: "updateInputs",
      source: "fromScratch",
      inputs: { text: "Cell biology" },
    });

    const state = generationSourceReducer(typed, { type: "reset" });

    expect(state.inputs.fromScratch.text).toBe("");
    expect(state.selected).toBe("fromScratch");
  });
});
