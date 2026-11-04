import { describe, expect, it } from "vitest";

import {
  generateQuiz,
  prepareQuiz,
  type GenerateQuizInput,
  type QuizAiClient,
} from "./index";

function fakeAi(response: unknown): QuizAiClient {
  return {
    complete: async () =>
      typeof response === "string" ? response : JSON.stringify(response),
  };
}

const fromScratch: GenerateQuizInput = {
  title: "Photosynthesis",
  source: { kind: "fromScratch", text: "Light reactions, medium difficulty" },
  questionCount: 2,
};

describe("generateQuiz from scratch", () => {
  it("returns the questions with 5 Choices and the correct index", async () => {
    const prepared = await prepareQuiz(fromScratch);
    const questions = await generateQuiz(prepared, {
      ai: fakeAi({
        questions: [
          {
            question_text: "Where do the light reactions happen?",
            choices: ["Stroma", "Thylakoid membrane", "Nucleus", "Cytosol", "Cell wall"],
            correct_index: 1,
          },
          {
            question_text: "Which gas is released?",
            choices: ["CO2", "N2", "O2", "H2", "CH4"],
            correct_index: 2,
          },
        ],
      }),
    });

    expect(questions).toEqual([
      {
        question_text: "Where do the light reactions happen?",
        choices: ["Stroma", "Thylakoid membrane", "Nucleus", "Cytosol", "Cell wall"],
        correct_index: 1,
      },
      {
        question_text: "Which gas is released?",
        choices: ["CO2", "N2", "O2", "H2", "CH4"],
        correct_index: 2,
      },
    ]);
  });

  it("rejects a question with the wrong number of Choices as invalid AI output", async () => {
    const prepared = await prepareQuiz(fromScratch);
    const ai = fakeAi({
      questions: [
        { question_text: "Q?", choices: ["A", "B", "C", "D"], correct_index: 0 },
      ],
    });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
    });
  });

  it("rejects an out-of-range correct index as invalid AI output", async () => {
    const prepared = await prepareQuiz(fromScratch);
    const ai = fakeAi({
      questions: [
        { question_text: "Q?", choices: ["A", "B", "C", "D", "E"], correct_index: 5 },
      ],
    });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
    });
  });

  it("turns a refusal of a gibberish topic into the invalid-input error", async () => {
    const prepared = await prepareQuiz({
      ...fromScratch,
      source: { kind: "fromScratch", text: "asdkjh qwpoe zzxv" },
    });
    const ai = fakeAi({ error: "Invalid topic provided." });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_input",
    });
  });
});

describe("prepareQuiz", () => {
  it("rejects blank From Scratch text as invalid input", async () => {
    const input: GenerateQuizInput = {
      ...fromScratch,
      source: { kind: "fromScratch", text: "   \n " },
    };

    await expect(prepareQuiz(input)).rejects.toMatchObject({ kind: "invalid_input" });
  });

  it("rejects From Scratch text over 40,000 characters as too long", async () => {
    const input: GenerateQuizInput = {
      ...fromScratch,
      source: { kind: "fromScratch", text: "a".repeat(40_001) },
    };

    await expect(prepareQuiz(input)).rejects.toMatchObject({ kind: "text_too_long" });
  });

  it("accepts From Scratch text of exactly 40,000 characters", async () => {
    const input: GenerateQuizInput = {
      title: "",
      source: { kind: "fromScratch", text: "a".repeat(40_000) },
      questionCount: 5,
    };

    await expect(prepareQuiz(input)).resolves.toBeDefined();
  });
});
