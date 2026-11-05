import pdfjsLib, { type PdfJsPage } from "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js";

// Bundlers default-import the CJS wrapper; the settings object lives on `.PDFJS`.
export const PDFJS = (pdfjsLib as { PDFJS?: typeof pdfjsLib }).PDFJS ?? pdfjsLib;
export type { PdfJsPage };

export function configurePdfJs() {
  PDFJS.disableWorker = true;
  // Node has no `document` for pdf.js to inject @font-face rules into.
  PDFJS.disableFontFace = true;
}
