import { MAX_CONTEXT_CHARS } from "@/lib/credits/contextMeter";

export type QuizGenerationErrorKind =
  | "text_too_long"
  | "invalid_input"
  | "invalid_ai_output";

const USER_MESSAGES: Record<QuizGenerationErrorKind, string> = {
  text_too_long: `Your text is over the ${MAX_CONTEXT_CHARS.toLocaleString("en-US")}-character limit. Shorten it and try again.`,
  invalid_input:
    "We couldn't make a quiz from that. Describe a real topic, difficulty, or style and try again.",
  invalid_ai_output: "The quiz couldn't be generated. Please try again.",
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
