import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { extractSampleTest } from "./extractSampleTest";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
}

const JPEG_START = [0xff, 0xd8];
const PNG_START = [0x89, 0x50, 0x4e, 0x47];

function startsWith(bytes: Uint8Array, start: number[]) {
  return start.every((byte, index) => bytes[index] === byte);
}

function expectInOrder(text: string, parts: string[]) {
  const positions = parts.map((part) => text.indexOf(part));
  expect(positions).not.toContain(-1);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
}

/** pdf.js injects fonts after reading returns, so wait for those delayed rejections. */
async function expectNoDocumentRejection(run: () => Promise<void>) {
  const rejections: unknown[] = [];
  const onReject = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on("unhandledRejection", onReject);
  try {
    await run();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(
      rejections.filter(
        (reason) => reason instanceof Error && reason.message.includes("document is not defined"),
      ),
    ).toEqual([]);
  } finally {
    process.off("unhandledRejection", onReject);
  }
}

function pngSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("extractSampleTest from a PDF", () => {
  it("marks each picture as a numbered Figure where it sits on the page", async () => {
    const { text } = await extractSampleTest({
      bytes: fixture("sample-test-figures.pdf"),
      mimeType: PDF,
    });

    expectInOrder(text, [
      "Use the diagram below.",
      "[FIGURE 1]",
      "(a) What is its speed",
      "(b) Which way",
      "[FIGURE 2]",
      "(c) Which graph",
      "2. Name the shape below.",
      "[FIGURE 3]",
    ]);
  });

  it("places a picture drawn inside a form where the form puts it", async () => {
    const { text } = await extractSampleTest({
      bytes: fixture("sample-test-form-figure.pdf"),
      mimeType: PDF,
    });

    expectInOrder(text, ["(a) What does the graph show?", "[FIGURE 1]", "(b) What is its slope?"]);
  });

  it("keeps each picture as a PNG of its full resolution", async () => {
    const { figures } = await extractSampleTest({
      bytes: fixture("sample-test-figures.pdf"),
      mimeType: PDF,
    });

    expect(figures).toHaveLength(3);
    for (const figure of figures) {
      expect(figure.mimeType).toBe("image/png");
      expect(startsWith(figure.bytes, PNG_START)).toBe(true);
      expect(pngSize(figure.bytes)).toEqual({ width: 40, height: 30 });
    }
  });

  it("finds no Figures in a PDF without pictures", async () => {
    const { text, figures } = await extractSampleTest({
      bytes: fixture("sample-test.pdf"),
      mimeType: PDF,
    });

    expect(figures).toEqual([]);
    expect(text).toContain("1. What makes ATP?");
  });

  it("rejects a PDF with no text as having no readable text", async () => {
    await expect(
      extractSampleTest({ bytes: fixture("blank.pdf"), mimeType: PDF }),
    ).rejects.toMatchObject({ kind: "no_readable_text" });
  });

  it("reads a PDF that embeds its own fonts without a document-missing rejection", async () => {
    await expectNoDocumentRejection(async () => {
      const { text, figures } = await extractSampleTest({
        bytes: fixture("embedded-font.pdf"),
        mimeType: PDF,
      });
      expect(figures).toEqual([]);
      expect(text).toContain("Photosynthesis happens in chloroplasts.");
    });
  });
});

describe("extractSampleTest from a DOCX", () => {
  it("marks each picture as a numbered Figure where it sits in the text", async () => {
    const { text } = await extractSampleTest({
      bytes: fixture("sample-test-figures.docx"),
      mimeType: DOCX,
    });

    expectInOrder(text, [
      "Use the diagram below.",
      "[FIGURE 1]",
      "(a) What is its speed",
      "(b) Which way",
      "[FIGURE 2]",
      "(c) Which graph",
      "2. Name the shape below.",
      "[FIGURE 3]",
    ]);
  });

  it("keeps each picture's file in Figure order", async () => {
    const { figures } = await extractSampleTest({
      bytes: fixture("sample-test-figures.docx"),
      mimeType: DOCX,
    });

    expect(figures.map((figure) => figure.mimeType)).toEqual([
      "image/jpeg",
      "image/png",
      "image/png",
    ]);
    expect(startsWith(figures[0].bytes, JPEG_START)).toBe(true);
    expect(startsWith(figures[1].bytes, PNG_START)).toBe(true);
  });

  it("reads text as plain text, not markup", async () => {
    const { text } = await extractSampleTest({
      bytes: fixture("sample-test-figures.docx"),
      mimeType: DOCX,
    });

    expect(text).toContain("A. Square & Circle");
    expect(text).not.toContain("<p>");
  });

  it("finds no Figures in a DOCX without pictures", async () => {
    const { text, figures } = await extractSampleTest({
      bytes: fixture("notes.docx"),
      mimeType: DOCX,
    });

    expect(figures).toEqual([]);
    expect(text).toContain("Photosynthesis happens in chloroplasts.");
  });
});
