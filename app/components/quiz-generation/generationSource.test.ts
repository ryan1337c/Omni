import { describe, expect, it } from "vitest";

import {
  generationSourceReducer,
  initialGenerationSourceState,
  usesQuestionCount,
  validateGenerationSource,
  type GenerationSourceAction,
} from "./generationSource";

const notesPdf = new File(["%PDF-1.4"], "notes.pdf", { type: "application/pdf" });

function apply(...actions: GenerationSourceAction[]) {
  return actions.reduce(generationSourceReducer, initialGenerationSourceState);
}

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
    const typed = apply(
      { type: "updateInputs", source: "fromScratch", inputs: { text: "Cell biology" } },
      { type: "select", source: "notes" },
      { type: "updateInputs", source: "notes", inputs: { file: notesPdf, focus: "Ch. 3" } },
    );

    const state = generationSourceReducer(typed, { type: "reset" });

    expect(state.inputs.fromScratch.text).toBe("");
    expect(state.inputs.notes).toEqual({ file: null, focus: "" });
    expect(state.selected).toBe("fromScratch");
  });

  it("keeps each source's inputs when switching between From Scratch and Notes", () => {
    const state = apply(
      { type: "updateInputs", source: "fromScratch", inputs: { text: "Cell biology" } },
      { type: "select", source: "notes" },
      { type: "updateInputs", source: "notes", inputs: { file: notesPdf, focus: "Ch. 3" } },
      { type: "select", source: "fromScratch" },
    );

    expect(state.selected).toBe("fromScratch");
    expect(state.inputs.fromScratch.text).toBe("Cell biology");

    const back = generationSourceReducer(state, { type: "select", source: "notes" });
    expect(back.inputs.notes).toEqual({ file: notesPdf, focus: "Ch. 3" });
  });
});

describe("Sample Test", () => {
  const examDocx = new File(["x"], "exam.docx", { type: "" });

  it("requires a file", () => {
    expect(validateGenerationSource(apply({ type: "select", source: "sampleTest" }))).toBe(
      "Please upload a PDF or DOCX file.",
    );
  });

  it("accepts a PDF or DOCX file", () => {
    const state = apply(
      { type: "select", source: "sampleTest" },
      { type: "updateInputs", source: "sampleTest", inputs: { file: examDocx } },
    );

    expect(validateGenerationSource(state)).toBeUndefined();
  });

  it("keeps each source's inputs when switching between all three sources", () => {
    const state = apply(
      { type: "updateInputs", source: "fromScratch", inputs: { text: "Cell biology" } },
      { type: "select", source: "notes" },
      { type: "updateInputs", source: "notes", inputs: { file: notesPdf, focus: "Ch. 3" } },
      { type: "select", source: "sampleTest" },
      { type: "updateInputs", source: "sampleTest", inputs: { file: examDocx } },
      { type: "select", source: "fromScratch" },
    );

    expect(state.inputs).toEqual({
      fromScratch: { text: "Cell biology" },
      notes: { file: notesPdf, focus: "Ch. 3" },
      sampleTest: { file: examDocx },
    });
  });

  it("hides Number of Questions only for Sample Test", () => {
    expect(usesQuestionCount("fromScratch")).toBe(true);
    expect(usesQuestionCount("notes")).toBe(true);
    expect(usesQuestionCount("sampleTest")).toBe(false);
  });

  it("is cleared on reset", () => {
    const state = apply(
      { type: "select", source: "sampleTest" },
      { type: "updateInputs", source: "sampleTest", inputs: { file: examDocx } },
      { type: "reset" },
    );

    expect(state.inputs.sampleTest).toEqual({ file: null });
  });
});

describe("validateGenerationSource for Notes", () => {
  const withNotes = (file: File | null, focus = "") =>
    apply(
      { type: "select", source: "notes" },
      { type: "updateInputs", source: "notes", inputs: { file, focus } },
    );

  it("requires a file", () => {
    expect(validateGenerationSource(withNotes(null, "Chapter 3"))).toBe(
      "Please upload a PDF or DOCX file.",
    );
  });

  it("accepts a PDF or DOCX file with no focus text", () => {
    expect(validateGenerationSource(withNotes(notesPdf))).toBeUndefined();
    expect(
      validateGenerationSource(withNotes(new File(["x"], "notes.docx", { type: "" }))),
    ).toBeUndefined();
  });

  it("rejects a file that isn't a PDF or DOCX", () => {
    const image = new File(["x"], "notes.png", { type: "image/png" });

    expect(validateGenerationSource(withNotes(image))).toBe("Upload a PDF or DOCX file.");
  });

  it("rejects a file over 4 MB", () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });

    expect(validateGenerationSource(withNotes(big))).toBe(
      "This file is larger than 4 MB. Shrink or split it and try again.",
    );
  });
});
