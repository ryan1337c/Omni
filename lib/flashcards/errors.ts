import { TEXT_TOO_LONG_MESSAGE } from "@/lib/quiz/errors";

export type DeckGenerationErrorKind =
  | "text_too_long"
  | "invalid_input"
  | "invalid_ai_output";

const USER_MESSAGES: Record<DeckGenerationErrorKind, string> = {
  text_too_long: TEXT_TOO_LONG_MESSAGE,
  invalid_input:
    "We couldn't make a deck from that. Use a real topic or real study material and try again.",
  invalid_ai_output: "The deck couldn't be generated. Please try again.",
};

export class DeckGenerationError extends Error {
  readonly name = "DeckGenerationError";
  readonly status = 400 as const;
  readonly kind: DeckGenerationErrorKind;

  constructor(kind: DeckGenerationErrorKind, detail?: string) {
    super(detail ?? USER_MESSAGES[kind]);
    this.kind = kind;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponseBody() {
    return { error: USER_MESSAGES[this.kind], code: this.kind };
  }
}
