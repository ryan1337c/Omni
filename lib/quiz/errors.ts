import { MAX_CONTEXT_CHARS } from "@/lib/credits/contextMeter";

export type QuizGenerationErrorKind =
  | "text_too_long"
  | "invalid_input"
  | "invalid_ai_output"
  | "missing_file"
  | "unsupported_file_type"
  | "file_too_large"
  | "no_readable_text"
  | "no_questions_found"
  | "too_many_questions";

export const MAX_SAMPLE_TEST_QUESTIONS = 50;

const USER_MESSAGES: Record<QuizGenerationErrorKind, string> = {
  text_too_long: `Your text is over the ${MAX_CONTEXT_CHARS.toLocaleString("en-US")}-character limit. Shorten or split it and try again.`,
  invalid_input:
    "We couldn't make a quiz from that. Use a real topic or real study material and try again.",
  invalid_ai_output: "The quiz couldn't be generated. Please try again.",
  missing_file: "Upload a PDF or DOCX file.",
  unsupported_file_type: "Only PDF and DOCX files are supported.",
  file_too_large: "Your file is larger than 4 MB. Shrink or split it and try again.",
  no_readable_text:
    "We couldn't read any text in your file. Scanned or image-only PDFs aren't supported.",
  no_questions_found:
    "We couldn't find any questions in your document. To build a quiz from study material, use Notes instead.",
  too_many_questions: `Your document has more than ${MAX_SAMPLE_TEST_QUESTIONS} questions. Split it into smaller tests and try again.`,
};

export class QuizGenerationError extends Error {
  readonly name = "QuizGenerationError";
  readonly status = 400 as const;
  readonly kind: QuizGenerationErrorKind;

  constructor(kind: QuizGenerationErrorKind, detail?: string) {
    super(detail ?? USER_MESSAGES[kind]);
    this.kind = kind;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponseBody() {
    return { error: USER_MESSAGES[this.kind], code: this.kind };
  }
}
