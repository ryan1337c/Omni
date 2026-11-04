import mammoth from "mammoth";
import pdf from "pdf-parse/lib/pdf-parse.js";

import { MAX_DOCUMENT_BYTES, PDF_MIME_TYPE, isSupportedDocumentType } from "./documentRules";
import { QuizGenerationError } from "./errors";

export type QuizDocument = { bytes: Uint8Array; mimeType: string };

/** Checks an uploaded document and returns its trimmed, non-empty text. */
export async function extractDocumentText(document: QuizDocument): Promise<string> {
  if (!isSupportedDocumentType(document.mimeType)) {
    throw new QuizGenerationError(
      "unsupported_file_type",
      `Unsupported document type "${document.mimeType}"`,
    );
  }
  if (document.bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new QuizGenerationError(
      "file_too_large",
      `Document is ${document.bytes.byteLength} bytes; the limit is ${MAX_DOCUMENT_BYTES}`,
    );
  }

  let text: string;
  try {
    text =
      document.mimeType === PDF_MIME_TYPE
        ? // pdf-parse misreads small Buffers (it reads past their slice of Node's shared pool), so it gets a plain copy.
          (await pdf(new Uint8Array(document.bytes))).text
        : (await mammoth.extractRawText({ buffer: Buffer.from(document.bytes) })).value;
  } catch (error) {
    throw new QuizGenerationError(
      "no_readable_text",
      `Document could not be read: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  text = text.trim();
  if (!text) {
    throw new QuizGenerationError("no_readable_text", "Document has no readable text");
  }
  return text;
}
