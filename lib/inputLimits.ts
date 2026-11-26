export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_FOCUS_LENGTH = 1_000;
export const MAX_CARD_SIDE_LENGTH = 1_000;
export const MAX_MANUAL_CARDS = 50;
export const MAX_QUESTION_TEXT_LENGTH = 1_000;
export const MAX_CHOICE_LENGTH = 300;
export const MAX_EXPLANATION_LENGTH = 1_000;
export const MAX_MANUAL_QUESTIONS = 50;
export const MAX_DISPLAY_NAME_LENGTH = 100;
export const MAX_FIRST_NAME_LENGTH = 50;
export const MAX_LAST_NAME_LENGTH = 50;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_SEARCH_LENGTH = 200;

export const CARD_LIMIT = MAX_MANUAL_CARDS;
export const QUESTION_LIMIT = MAX_MANUAL_QUESTIONS;

export const MAX_CHAT_FILES = 5;
export const MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CHAT_TOTAL_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_CHAT_FIELDS_SIZE = 4 * 1024 * 1024;

export const TOO_MANY_CHAT_FILES_MESSAGE =
  "You can attach up to 5 files per message.";
export const CHAT_FILE_TOO_LARGE_MESSAGE =
  "Each attachment must be 10MB or smaller.";
export const CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE =
  "Attachments can total up to 25MB per message.";
export const CHAT_FILE_TYPE_MESSAGE =
  "Attachments must be PNG, JPEG, WebP, PDF, or TXT files.";

export const CHAT_ATTACHMENT_ACCEPT = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".pdf",
  ".txt",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
].join(",");

const CHAT_ATTACHMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const CHAT_ATTACHMENT_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".pdf",
  ".txt",
]);

export const MAX_IMAGE_PROMPT_LENGTH = 40_000;
export const MIN_CARD_COUNT = 5;
export const MAX_CARD_COUNT = 50;
export const MIN_QUESTION_COUNT = 1;
export const MAX_QUESTION_COUNT = 50;

export const MAX_JOB_TITLE_LENGTH = 120;
export const MAX_JOB_DESCRIPTION_LENGTH = 15_000;
export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
export const RESUME_TOO_LARGE_MESSAGE = "Your resume must be 5MB or smaller.";

export const MAX_CONTACT_NAME_LENGTH = 100;
export const MAX_CONTACT_MESSAGE_LENGTH = 5_000;

export class InputLimitError extends Error {
  readonly name = "InputLimitError";
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413 = 400) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function lengthError(label: string, max: number): string {
  return `${label} must be ${max.toLocaleString("en-US")} characters or fewer.`;
}

export function passwordRangeError(): string {
  return `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`;
}

export function itemCountError(label: string, max: number): string {
  return `${label} is limited to ${max}.`;
}

export function countRangeError(label: string, min: number, max: number): string {
  return `${label} must be an integer from ${min} to ${max}.`;
}

export function assertLength(
  value: string | null | undefined,
  max: number,
  label: string,
): void {
  if ((value?.length ?? 0) > max) {
    throw new InputLimitError(lengthError(label, max));
  }
}

export function assertItemCount(count: number, max: number, label: string): void {
  if (count > max) {
    throw new InputLimitError(itemCountError(label, max));
  }
}

export function assertIntegerInRange(
  value: unknown,
  min: number,
  max: number,
  label: string,
): number {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(count) || count < min || count > max) {
    throw new InputLimitError(countRangeError(label, min, max));
  }
  return count;
}

export function assertPassword(
  password: string,
  options: { requireMin?: boolean } = {},
): void {
  const requireMin = options.requireMin === true;
  if (requireMin && password.length < MIN_PASSWORD_LENGTH) {
    throw new InputLimitError(passwordRangeError());
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new InputLimitError(
      requireMin
        ? passwordRangeError()
        : lengthError("Password", MAX_PASSWORD_LENGTH),
    );
  }
}

export function assertManualCards(
  cards: ReadonlyArray<{ front?: string; back?: string }>,
): void {
  assertItemCount(cards.length, MAX_MANUAL_CARDS, "A deck");
  for (const card of cards) {
    assertLength(card.front ?? "", MAX_CARD_SIDE_LENGTH, "Card front");
    assertLength(card.back ?? "", MAX_CARD_SIDE_LENGTH, "Card back");
  }
}

export function assertManualQuestions(
  questions: ReadonlyArray<{
    question_text?: string;
    choices?: string[];
    explanation?: string | null;
  }>,
): void {
  assertItemCount(questions.length, MAX_MANUAL_QUESTIONS, "A quiz");
  for (const question of questions) {
    assertLength(
      question.question_text ?? "",
      MAX_QUESTION_TEXT_LENGTH,
      "Question text",
    );
    assertLength(
      question.explanation ?? "",
      MAX_EXPLANATION_LENGTH,
      "Explanation",
    );
    for (const choice of question.choices ?? []) {
      assertLength(choice, MAX_CHOICE_LENGTH, "Choice text");
    }
  }
}

export type ChatAttachmentLike = {
  name?: string;
  originalFilename?: string | null;
  type?: string;
  mimetype?: string | null;
  size: number;
};

function attachmentExtension(file: ChatAttachmentLike): string {
  const name = file.name || file.originalFilename || "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function attachmentMime(file: ChatAttachmentLike): string {
  return (file.type || file.mimetype || "").toLowerCase().split(";")[0].trim();
}

export function isAllowedChatAttachment(file: ChatAttachmentLike): boolean {
  const mime = attachmentMime(file);
  if (mime && mime !== "application/octet-stream") {
    return CHAT_ATTACHMENT_MIME_TYPES.has(mime);
  }
  return CHAT_ATTACHMENT_EXTENSIONS.has(attachmentExtension(file));
}

export function checkChatAttachment(
  file: ChatAttachmentLike,
  existing: ReadonlyArray<{ size: number }>,
): string | undefined {
  if (existing.length >= MAX_CHAT_FILES) {
    return TOO_MANY_CHAT_FILES_MESSAGE;
  }
  if (!isAllowedChatAttachment(file)) {
    return CHAT_FILE_TYPE_MESSAGE;
  }
  if (file.size > MAX_CHAT_FILE_BYTES) {
    return CHAT_FILE_TOO_LARGE_MESSAGE;
  }
  const total = existing.reduce((sum, item) => sum + item.size, 0) + file.size;
  if (total > MAX_CHAT_TOTAL_FILE_BYTES) {
    return CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE;
  }
  return undefined;
}

export function assertChatAttachments(
  files: ReadonlyArray<ChatAttachmentLike>,
): void {
  if (files.length > MAX_CHAT_FILES) {
    throw new InputLimitError(TOO_MANY_CHAT_FILES_MESSAGE, 413);
  }
  const accepted: ChatAttachmentLike[] = [];
  for (const file of files) {
    const error = checkChatAttachment(file, accepted);
    if (error) {
      throw new InputLimitError(
        error,
        error === CHAT_FILE_TYPE_MESSAGE ? 400 : 413,
      );
    }
    accepted.push(file);
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
