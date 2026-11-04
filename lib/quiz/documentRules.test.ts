import { describe, expect, it } from "vitest";

import { resolveDocumentMimeType } from "./documentRules";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("resolveDocumentMimeType", () => {
  it("keeps a reported PDF or DOCX type", () => {
    expect(resolveDocumentMimeType(PDF, "notes.pdf")).toBe(PDF);
    expect(resolveDocumentMimeType(DOCX, "notes.docx")).toBe(DOCX);
  });

  it.each([
    ["blank", ""],
    ["missing", undefined],
    ["generic", "application/octet-stream"],
  ])("falls back to the file extension when the type is %s", (_, mimeType) => {
    expect(resolveDocumentMimeType(mimeType, "notes.docx")).toBe(DOCX);
    expect(resolveDocumentMimeType(mimeType, "Notes.PDF")).toBe(PDF);
  });

  it("keeps a reported type that isn't PDF or DOCX, whatever the extension", () => {
    expect(resolveDocumentMimeType("image/png", "notes.pdf")).toBe("image/png");
    expect(resolveDocumentMimeType("text/plain", "notes.docx")).toBe("text/plain");
  });
});
