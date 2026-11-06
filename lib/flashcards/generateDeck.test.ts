import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { generateDeck, prepareDeck, type DeckAiClient, type GenerateDeckInput } from "./index";

function recordingAi(response: unknown) {
  const prompts: { system: string; user: string }[] = [];
  const ai: DeckAiClient = {
    complete: async (prompt) => {
      prompts.push(prompt);
      return JSON.stringify(response);
    },
  };
  return { ai, prompts };
}

const fromScratch: GenerateDeckInput = {
  title: "Biochemistry",
  source: { kind: "fromScratch", text: "Enzymes, hard difficulty" },
  cardCount: 10,
};

describe("prepareDeck", () => {
  it("rejects blank Topic or Text as invalid input", async () => {
    const input: GenerateDeckInput = {
      ...fromScratch,
      source: { kind: "fromScratch", text: "   \n " },
    };

    await expect(prepareDeck(input)).rejects.toMatchObject({ kind: "invalid_input" });
  });

  it("rejects Topic or Text over 40,000 characters as too long", async () => {
    const input: GenerateDeckInput = {
      ...fromScratch,
      source: { kind: "fromScratch", text: "a".repeat(40_001) },
    };

    await expect(prepareDeck(input)).rejects.toMatchObject({ kind: "text_too_long" });
  });

  it("accepts Topic or Text of exactly 40,000 characters", async () => {
    const input: GenerateDeckInput = {
      title: "",
      source: { kind: "fromScratch", text: "a".repeat(40_000) },
      cardCount: 5,
    };

    await expect(prepareDeck(input)).resolves.toBeDefined();
  });
});

describe("generateDeck from From Scratch", () => {
  it("writes Cards from Topic or Text and sends the title as context", async () => {
    const { ai, prompts } = recordingAi({
      cards: [{ front: "What is an enzyme?", back: "A protein that speeds a reaction." }],
    });

    const prepared = await prepareDeck(fromScratch);
    const cards = await generateDeck(prepared, { ai });

    expect(prompts[0].user).toContain("Enzymes, hard difficulty");
    expect(prompts[0].user).toContain('Context/Title: "Biochemistry"');
    expect(prompts[0].user).toContain("exactly 10");
    expect(prepared.pricedText).toEqual(["Biochemistry", "Enzymes, hard difficulty"]);
    expect(cards).toEqual([
      { front: "What is an enzyme?", back: "A protein that speeds a reaction." },
    ]);
  });
});

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`../quiz/fixtures/${name}`, import.meta.url)));
}

function notes(name: string, mimeType: string, focus?: string): GenerateDeckInput {
  return {
    title: "Cell biology",
    source: { kind: "notes", document: { bytes: fixture(name), mimeType }, focus },
    cardCount: 8,
  };
}

describe("generateDeck from Notes", () => {
  it("writes Cards from the document text, not from any other source", async () => {
    const { ai, prompts } = recordingAi({
      cards: [{ front: "What makes ATP?", back: "Mitochondria." }],
    });

    const prepared = await prepareDeck(notes("notes.pdf", PDF));
    const cards = await generateDeck(prepared, { ai });

    expect(prompts[0].user).toContain("Mitochondria make ATP.");
    expect(prompts[0].user).toContain("Ribosomes build proteins.");
    expect(prompts[0].user).toContain("(none)");
    expect(prompts[0].user).not.toContain("Enzymes, hard difficulty");
    expect(cards).toEqual([{ front: "What makes ATP?", back: "Mitochondria." }]);
  });

  it("passes Focus with the document text and prices both", async () => {
    const { ai, prompts } = recordingAi({
      cards: [{ front: "Where does photosynthesis happen?", back: "In chloroplasts." }],
    });

    const prepared = await prepareDeck(notes("notes.docx", DOCX, "Only chlorophyll"));
    await generateDeck(prepared, { ai });

    expect(prompts[0].user).toContain("Photosynthesis happens in chloroplasts.");
    expect(prompts[0].user).toContain("Only chlorophyll");
    expect(prepared.pricedText).toContain("Cell biology");
    expect(prepared.pricedText.join(" ")).toContain("Chlorophyll absorbs light.");
    expect(prepared.pricedText).toContain("Only chlorophyll");
  });

  it("rejects a file that isn't a PDF or DOCX", async () => {
    await expect(prepareDeck(notes("notes.pdf", "image/png"))).rejects.toMatchObject({
      kind: "unsupported_file_type",
    });
  });

  it("rejects a file over 4 MB", async () => {
    const input: GenerateDeckInput = {
      title: "Big",
      source: {
        kind: "notes",
        document: { bytes: new Uint8Array(4 * 1024 * 1024 + 1), mimeType: PDF },
      },
      cardCount: 5,
    };

    await expect(prepareDeck(input)).rejects.toMatchObject({ kind: "file_too_large" });
  });

  it.each([
    ["a PDF with no text, like a scan", "blank.pdf", PDF],
    ["an empty DOCX", "empty.docx", DOCX],
  ])("rejects %s as having no readable text", async (_, name, mimeType) => {
    await expect(prepareDeck(notes(name, mimeType))).rejects.toMatchObject({
      kind: "no_readable_text",
    });
  });

  it("rejects a document with over 40,000 characters of text as too long", async () => {
    await expect(prepareDeck(notes("long.docx", DOCX))).rejects.toMatchObject({
      kind: "text_too_long",
    });
  });
});

describe("generateDeck output", () => {
  it("rejects a Card with a blank side as invalid AI output", async () => {
    const prepared = await prepareDeck(fromScratch);
    const ai: DeckAiClient = {
      complete: async () => JSON.stringify({ cards: [{ front: "Term", back: "   " }] }),
    };

    await expect(generateDeck(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
    });
  });

  it("turns a refusal of a gibberish topic into the invalid-input error", async () => {
    const prepared = await prepareDeck({
      ...fromScratch,
      source: { kind: "fromScratch", text: "asdkjh qwpoe zzxv" },
    });
    const ai: DeckAiClient = {
      complete: async () => JSON.stringify({ error: "Invalid topic provided." }),
    };

    await expect(generateDeck(prepared, { ai })).rejects.toMatchObject({ kind: "invalid_input" });
  });
});
