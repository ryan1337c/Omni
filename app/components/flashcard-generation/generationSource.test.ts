import { describe, expect, it } from "vitest";

import {
  generationSourceReducer,
  initialGenerationSourceState,
  nextSourceError,
  updateInputs,
  validateGenerationSource,
  type GenerationSourceAction,
} from "./generationSource";

const notesPdf = new File(["%PDF-1.4"], "notes.pdf", { type: "application/pdf" });

function apply(...actions: GenerationSourceAction[]) {
  return actions.reduce(generationSourceReducer, initialGenerationSourceState);
}

function notesState(file: File | null, focus = "") {
  return {
    selected: "notes" as const,
    inputs: {
      ...initialGenerationSourceState.inputs,
      notes: { file, focus },
    },
  };
}

describe("validateGenerationSource", () => {
  it("rejects From Scratch with an empty Topic or Text box", () => {
    expect(validateGenerationSource(initialGenerationSourceState)).toBe(
      "Please enter a topic.",
    );
  });

  it("rejects From Scratch Topic or Text that is only whitespace", () => {
    expect(
      validateGenerationSource({
        ...initialGenerationSourceState,
        inputs: {
          ...initialGenerationSourceState.inputs,
          fromScratch: { text: "   \n " },
        },
      }),
    ).toBe("Please enter a topic.");
  });

  it("accepts From Scratch once Topic or Text is filled", () => {
    expect(
      validateGenerationSource({
        ...initialGenerationSourceState,
        inputs: {
          ...initialGenerationSourceState.inputs,
          fromScratch: { text: "Biochemistry midterm, hard" },
        },
      }),
    ).toBeUndefined();
  });

  it("requires a Notes file even when Focus is filled", () => {
    expect(
      validateGenerationSource({
        selected: "notes",
        inputs: {
          ...initialGenerationSourceState.inputs,
          notes: { file: null, focus: "Chapter 3" },
        },
      }),
    ).toBe("Upload a PDF or DOCX file.");
  });

  it("accepts a PDF or DOCX Notes file with no Focus", () => {
    expect(validateGenerationSource(notesState(notesPdf))).toBeUndefined();
    expect(
      validateGenerationSource(notesState(new File(["x"], "notes.docx", { type: "" }))),
    ).toBeUndefined();
  });

  it("rejects a Notes file that isn't a PDF or DOCX", () => {
    const image = new File(["x"], "notes.png", { type: "image/png" });

    expect(validateGenerationSource(notesState(image))).toBe("Upload a PDF or DOCX file.");
  });

  it("rejects a Notes file over 4 MB", () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });

    expect(validateGenerationSource(notesState(big))).toBe(
      "Your file is larger than 4 MB. Shrink or split it and try again.",
    );
  });
});

describe("generationSourceReducer", () => {
  it("starts with From Scratch selected and stores Topic or Text", () => {
    expect(initialGenerationSourceState.selected).toBe("fromScratch");

    const state = generationSourceReducer(initialGenerationSourceState, {
      type: "updateInputs",
      source: "fromScratch",
      inputs: { text: "Cell biology" },
    });

    expect(state.inputs.fromScratch.text).toBe("Cell biology");
  });

  it("keeps each source's inputs when switching between From Scratch and Notes", () => {
    const state = apply(
      updateInputs("fromScratch", { text: "Cell biology" }),
      { type: "select", source: "notes" },
      updateInputs("notes", { file: notesPdf, focus: "Ch. 3" }),
      { type: "select", source: "fromScratch" },
    );

    expect(state.selected).toBe("fromScratch");
    expect(state.inputs.fromScratch.text).toBe("Cell biology");

    const back = generationSourceReducer(state, { type: "select", source: "notes" });
    expect(back.inputs.notes).toEqual({ file: notesPdf, focus: "Ch. 3" });
  });

  it("clears every source's inputs on reset", () => {
    const typed = apply(
      updateInputs("fromScratch", { text: "Cell biology" }),
      { type: "select", source: "notes" },
      updateInputs("notes", { file: notesPdf, focus: "Ch. 3" }),
    );

    const state = generationSourceReducer(typed, { type: "reset" });

    expect(state).toEqual(initialGenerationSourceState);
  });
});

describe("nextSourceError", () => {
  const image = new File(["x"], "notes.png", { type: "image/png" });
  const change = (current: string | undefined, ...actions: GenerationSourceAction[]) => {
    const before = apply(...actions.slice(0, -1));
    const action = actions[actions.length - 1];
    return nextSourceError(current, action, generationSourceReducer(before, action));
  };

  it("shows a chosen file's problem at once", () => {
    expect(
      change(undefined, { type: "select", source: "notes" }, updateInputs("notes", { file: image })),
    ).toBe("Upload a PDF or DOCX file.");
  });

  it("waits for submit while typing Topic or Text", () => {
    expect(change(undefined, updateInputs("fromScratch", { text: "  " }))).toBeUndefined();
    expect(change("Please enter a topic.", updateInputs("fromScratch", { text: "  " }))).toBe(
      "Please enter a topic.",
    );
  });

  it("clears once the source is valid or the other source is selected", () => {
    expect(change("Please enter a topic.", updateInputs("fromScratch", { text: "Cells" }))).toBeUndefined();
    expect(change("Upload a PDF or DOCX file.", { type: "select", source: "fromScratch" })).toBeUndefined();
    expect(
      change(
        "Upload a PDF or DOCX file.",
        { type: "select", source: "notes" },
        updateInputs("notes", { file: notesPdf }),
      ),
    ).toBeUndefined();
  });
});
