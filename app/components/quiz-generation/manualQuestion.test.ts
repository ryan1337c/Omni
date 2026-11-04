import { describe, expect, it } from "vitest";

import { toManualQuestion } from "./manualQuestion";

describe("toManualQuestion", () => {
  it("keeps the question text, Choices, correct index, and Explanation of a saved question", () => {
    const saved = {
      id: 42,
      question_text: "What is the capital of France?",
      question_type: "mcq",
      explanation: "Paris has been the capital since the 10th century.",
      choices: [
        { choice_text: "Paris", is_correct: true },
        { choice_text: "Lyon", is_correct: false },
        { choice_text: "Nice", is_correct: false },
      ],
    };

    expect(toManualQuestion(saved)).toEqual({
      id: "42",
      question_text: "What is the capital of France?",
      type: "multiple_choice",
      choices: ["Paris", "Lyon", "Nice"],
      correct_index: 0,
      explanation: "Paris has been the capital since the 10th century.",
    });
  });

  it("maps a null Explanation to an empty Explanation", () => {
    const saved = {
      id: "7",
      question_text: "2 + 2 = ?",
      explanation: null,
      choices: [
        { choice_text: "4", is_correct: true },
        { choice_text: "5", is_correct: false },
      ],
    };

    expect(toManualQuestion(saved).explanation).toBe("");
  });

  it("takes the correct index from the Choice marked correct", () => {
    const saved = {
      id: "8",
      question_text: "Which planet is largest?",
      explanation: null,
      choices: [
        { choice_text: "Mars", is_correct: false },
        { choice_text: "Venus", is_correct: false },
        { choice_text: "Jupiter", is_correct: true },
        { choice_text: "Earth", is_correct: false },
      ],
    };

    expect(toManualQuestion(saved).correct_index).toBe(2);
  });
});
