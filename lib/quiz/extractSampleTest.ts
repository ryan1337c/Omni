import mammoth from "mammoth";

import { PDF_MIME_TYPE } from "./documentRules";
import { checkDocumentTypeAndSize, requireReadableText, type QuizDocument } from "./extractDocumentText";
import { figureMarker, isFigureMimeType, type Figure } from "./figureRules";
import { readPdfSampleTest } from "./readPdfSampleTest";

/** A Sample Test's text, with a Figure marker where each of its Figures sits. */
export type SampleTestContent = { text: string; figures: Figure[] };

export async function extractSampleTest(document: QuizDocument): Promise<SampleTestContent> {
  checkDocumentTypeAndSize(document);
  return document.mimeType === PDF_MIME_TYPE
    ? extractPdf(document.bytes)
    : extractDocx(document.bytes);
}

async function extractPdf(bytes: Uint8Array): Promise<SampleTestContent> {
  let figures: Figure[] = [];
  const text = await requireReadableText(async () => {
    const content = await readPdfSampleTest(bytes);
    figures = content.figures;
    return content.text;
  });
  return { text, figures };
}

async function extractDocx(bytes: Uint8Array): Promise<SampleTestContent> {
  const figures: Figure[] = [];
  const text = await requireReadableText(async () => {
    const { value: html } = await mammoth.convertToHtml(
      { buffer: Buffer.from(bytes) },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const { contentType } = image;
          if (!isFigureMimeType(contentType)) {
            return { src: "" };
          }
          // Claim the slot before awaiting so Figures stay in document order.
          const index = figures.length;
          figures.length += 1;
          figures[index] = { bytes: new Uint8Array(await image.read()), mimeType: contentType };
          return { src: figureMarker(index + 1) };
        }),
      },
    );
    return htmlToText(html);
  });
  return { text, figures };
}

function htmlToText(html: string): string {
  return html
    .replace(/<img [^>]*?src="([^"]*)"[^>]*>/g, (_, src: string) => (src ? `\n${src}\n` : ""))
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/(p|h[1-6]|li|tr)>/g, "\n")
    .replace(/<\/t[dh]>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n");
}
