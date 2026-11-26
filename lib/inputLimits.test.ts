import { describe, expect, it } from "vitest";

import {
  CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE,
  CHAT_FILE_TOO_LARGE_MESSAGE,
  CHAT_FILE_TYPE_MESSAGE,
  InputLimitError,
  MAX_CARD_SIDE_LENGTH,
  MAX_CHAT_FILE_BYTES,
  MAX_CHAT_FILES,
  MAX_CHAT_TOTAL_FILE_BYTES,
  MAX_CHOICE_LENGTH,
  MAX_IMAGE_PROMPT_LENGTH,
  MAX_MANUAL_CARDS,
  MAX_MANUAL_QUESTIONS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  TOO_MANY_CHAT_FILES_MESSAGE,
  assertChatAttachments,
  assertIntegerInRange,
  assertLength,
  assertManualCards,
  assertManualQuestions,
  assertPassword,
  checkChatAttachment,
  countRangeError,
  escapeHtml,
  lengthError,
  passwordRangeError,
} from "./inputLimits";

describe("assertLength", () => {
  it("allows values at or under the cap", () => {
    assertLength("abc", 3, "Title");
    assertLength("", 3, "Title");
    assertLength(undefined, 3, "Title");
  });

  it("rejects values over the cap with a friendly message", () => {
    expect(() => assertLength("abcd", 3, "Title")).toThrow(InputLimitError);
    expect(() => assertLength("abcd", 3, "Title")).toThrow(
      lengthError("Title", 3),
    );
  });

  it("formats thousands in length errors", () => {
    expect(lengthError("Image prompt", MAX_IMAGE_PROMPT_LENGTH)).toBe(
      "Image prompt must be 40,000 characters or fewer.",
    );
  });
});

describe("assertPassword", () => {
  it("requires 8-72 characters when requireMin is set", () => {
    expect(() => assertPassword("short", { requireMin: true })).toThrow(
      passwordRangeError(),
    );
    expect(() =>
      assertPassword("x".repeat(MAX_PASSWORD_LENGTH + 1), { requireMin: true }),
    ).toThrow(passwordRangeError());
    assertPassword("x".repeat(MIN_PASSWORD_LENGTH), { requireMin: true });
  });

  it("allows short passwords on login and only caps at 72", () => {
    assertPassword("short");
    expect(() =>
      assertPassword("x".repeat(MAX_PASSWORD_LENGTH + 1)),
    ).toThrow(lengthError("Password", MAX_PASSWORD_LENGTH));
  });
});

describe("assertManualCards and questions", () => {
  it("rejects too many cards or overlong sides", () => {
    expect(() =>
      assertManualCards(
        Array.from({ length: MAX_MANUAL_CARDS + 1 }, () => ({
          front: "a",
          back: "b",
        })),
      ),
    ).toThrow(`A deck is limited to ${MAX_MANUAL_CARDS}.`);
    expect(() =>
      assertManualCards([
        { front: "x".repeat(MAX_CARD_SIDE_LENGTH + 1), back: "ok" },
      ]),
    ).toThrow(lengthError("Card front", MAX_CARD_SIDE_LENGTH));
  });

  it("rejects too many questions or overlong fields", () => {
    expect(() =>
      assertManualQuestions(
        Array.from({ length: MAX_MANUAL_QUESTIONS + 1 }, () => ({
          question_text: "Q",
          choices: ["A", "B"],
          explanation: "",
        })),
      ),
    ).toThrow(`A quiz is limited to ${MAX_MANUAL_QUESTIONS}.`);
    expect(() =>
      assertManualQuestions([
        {
          question_text: "Q",
          choices: ["x".repeat(MAX_CHOICE_LENGTH + 1)],
          explanation: "",
        },
      ]),
    ).toThrow(lengthError("Choice text", MAX_CHOICE_LENGTH));
  });
});

describe("assertIntegerInRange", () => {
  it("accepts integers inside the range and rejects NaN or out-of-range values", () => {
    expect(assertIntegerInRange("10", 5, 50, "Card count")).toBe(10);
    expect(assertIntegerInRange(1, 1, 50, "Question count")).toBe(1);
    expect(() => assertIntegerInRange("nope", 5, 50, "Card count")).toThrow(
      InputLimitError,
    );
    expect(() => assertIntegerInRange("nope", 5, 50, "Card count")).toThrow(
      countRangeError("Card count", 5, 50),
    );
    expect(() => assertIntegerInRange(4, 5, 50, "Card count")).toThrow(
      countRangeError("Card count", 5, 50),
    );
    expect(() => assertIntegerInRange(10.5, 5, 50, "Card count")).toThrow(
      countRangeError("Card count", 5, 50),
    );
  });
});

describe("chat attachments", () => {
  const png = (size: number, name = "photo.png") => ({
    name,
    type: "image/png",
    size,
  });

  it("rejects disallowed types, oversized files, too many files, and over-total size", () => {
    expect(checkChatAttachment({ name: "x.zip", type: "application/zip", size: 10 }, [])).toBe(
      CHAT_FILE_TYPE_MESSAGE,
    );
    expect(checkChatAttachment(png(MAX_CHAT_FILE_BYTES + 1), [])).toBe(
      CHAT_FILE_TOO_LARGE_MESSAGE,
    );
    const five = Array.from({ length: MAX_CHAT_FILES }, () => png(1));
    expect(checkChatAttachment(png(1), five)).toBe(TOO_MANY_CHAT_FILES_MESSAGE);
    expect(
      checkChatAttachment(png(6 * 1024 * 1024), [png(20 * 1024 * 1024)]),
    ).toBe(CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE);
  });

  it("allows a missing MIME type when the extension is on the allow-list", () => {
    expect(
      checkChatAttachment({ name: "notes.txt", type: "", size: 12 }, []),
    ).toBeUndefined();
  });

  it("throws 413 for size or count and 400 for type", () => {
    try {
      assertChatAttachments([png(MAX_CHAT_FILE_BYTES + 1)]);
      throw new Error("expected assertChatAttachments to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InputLimitError);
      expect((error as InputLimitError).status).toBe(413);
    }

    try {
      assertChatAttachments([
        { name: "x.zip", type: "application/zip", size: 10 },
      ]);
      throw new Error("expected assertChatAttachments to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InputLimitError);
      expect((error as InputLimitError).status).toBe(400);
      expect((error as InputLimitError).message).toBe(CHAT_FILE_TYPE_MESSAGE);
    }

    expect(MAX_CHAT_TOTAL_FILE_BYTES).toBe(25 * 1024 * 1024);
  });
});

describe("escapeHtml", () => {
  it("escapes markup before callers convert newlines", () => {
    expect(escapeHtml("<script>alert(\"x\")</script>&")).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;",
    );
    expect(escapeHtml("line 1\nline 2").replace(/\n/g, "<br>")).toBe(
      "line 1<br>line 2",
    );
  });
});
