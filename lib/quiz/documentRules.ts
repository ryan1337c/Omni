export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const PDF_MIME_TYPE = "application/pdf";
export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const EXTENSION_MIME_TYPES: Record<string, string> = {
  pdf: PDF_MIME_TYPE,
  docx: DOCX_MIME_TYPE,
};

/** `accept` value for file inputs that take a Notes or Sample Test document. */
export const DOCUMENT_ACCEPT = [".pdf", ".docx", PDF_MIME_TYPE, DOCX_MIME_TYPE].join(",");

export function isSupportedDocumentType(mimeType: string): boolean {
  return mimeType === PDF_MIME_TYPE || mimeType === DOCX_MIME_TYPE;
}

/**
 * Browsers and upload parsers sometimes report a blank or generic MIME type
 * for DOCX files, so fall back to the file extension.
 */
export function resolveDocumentMimeType(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): string {
  if (mimeType && isSupportedDocumentType(mimeType)) {
    return mimeType;
  }
  const extension = fileName?.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_TYPES[extension] ?? mimeType ?? "";
}

/** Client-side check of a chosen document; returns a user-facing error. */
export function checkDocumentFile(file: {
  name: string;
  type: string;
  size: number;
}): string | undefined {
  if (!isSupportedDocumentType(resolveDocumentMimeType(file.type, file.name))) {
    return "Upload a PDF or DOCX file.";
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return "This file is larger than 4 MB. Shrink or split it and try again.";
  }
  return undefined;
}
