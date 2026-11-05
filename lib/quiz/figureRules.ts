export const MAX_FIGURES_PER_QUESTION = 4;

export const MAX_FIGURE_BYTES = 4 * 1024 * 1024;

export const FIGURE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type FigureMimeType = (typeof FIGURE_MIME_TYPES)[number];

/** A picture shown with a question. */
export type Figure = { bytes: Uint8Array; mimeType: FigureMimeType };

/** A Figure saved in storage, with a short-lived URL to show it. */
export type StoredFigure = { path: string; url: string };

export const FIGURE_BUCKET = "images";

/** Long enough to outlast the longest quiz and its Review. */
export const FIGURE_URL_SECONDS = 6 * 60 * 60;

const FIGURE_EXTENSIONS: Record<FigureMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** A new storage path for one of a user's Figures; storage policies only let users reach their own folder. */
export function newFigurePath(userId: string, mimeType: FigureMimeType): string {
  return `quiz-figures/${userId}/${crypto.randomUUID()}.${FIGURE_EXTENSIONS[mimeType]}`;
}

/** `accept` value for file inputs that take Figures. */
export const FIGURE_ACCEPT = FIGURE_MIME_TYPES.join(",");

/** Stands in for a Sample Test's picture in the text the AI reads; Figures number from 1. */
export function figureMarker(figureNumber: number): string {
  return `[FIGURE ${figureNumber}]`;
}

/** A question's Figures are numbered only when it has more than one, so a lone Figure has no label. */
export function figureNumberLabel(index: number, count: number): string | null {
  return count > 1 ? `Figure ${index + 1}` : null;
}

export function isFigureMimeType(mimeType: string): mimeType is FigureMimeType {
  return FIGURE_MIME_TYPES.includes(mimeType as FigureMimeType);
}

/** Client-side check of pictures being added to a question; returns a user-facing error. */
export function checkFigureFiles(
  files: { type: string; size: number }[],
  existingCount: number,
): string | undefined {
  if (existingCount + files.length > MAX_FIGURES_PER_QUESTION) {
    return `A question can have at most ${MAX_FIGURES_PER_QUESTION} Figures.`;
  }
  if (files.some((file) => !isFigureMimeType(file.type))) {
    return "Figures must be PNG, JPEG, or WebP images.";
  }
  if (files.some((file) => file.size > MAX_FIGURE_BYTES)) {
    return `Each Figure must be ${MAX_FIGURE_BYTES / (1024 * 1024)} MB or smaller.`;
  }
  return undefined;
}
