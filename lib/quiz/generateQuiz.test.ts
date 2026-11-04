import { readFileSync } from "node:fs";
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

function recordingAi(response: unknown) {
  const prompts: { system: string; user: string }[] = [];
  const ai: QuizAiClient = {
    complete: async (prompt) => {
      prompts.push(prompt);
      return JSON.stringify(response);
    },
  };
  return { ai, prompts };
}

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
}

function notes(
  name: string,
  mimeType: string,
  focus?: string,
): GenerateQuizInput {
  return {
    title: "Cell biology",
    source: { kind: "notes", document: { bytes: fixture(name), mimeType }, focus },
    questionCount: 1,
  };
}

const oneValidQuestion = {
  questions: [
    {
      question_text: "What makes ATP?",
      choices: ["Mitochondria", "Ribosomes", "Nucleus", "Golgi", "Lysosome"],
      correct_index: 0,
      explanation: "Mitochondria make ATP.",
    },
  ],
};

const fromScratch: GenerateQuizInput = {
  title: "Photosynthesis",
  source: { kind: "fromScratch", text: "Light reactions, medium difficulty" },
  questionCount: 2,
};

describe("generateQuiz from scratch", () => {
  it("returns the questions with 5 Choices, the correct index, and an Explanation", async () => {
    const prepared = await prepareQuiz(fromScratch);
    const questions = await generateQuiz(prepared, {
      ai: fakeAi({
        questions: [
          {
            question_text: "Where do the light reactions happen?",
            choices: ["Stroma", "Thylakoid membrane", "Nucleus", "Cytosol", "Cell wall"],
            correct_index: 1,
            explanation:
              "The light reactions run on the thylakoid membrane. The stroma hosts the Calvin cycle instead.",
          },
          {
            question_text: "Which gas is released?",
            choices: ["CO2", "N2", "O2", "H2", "CH4"],
            correct_index: 2,
            explanation: "Splitting water releases O2 as a by-product.",
          },
        ],
      }),
    });

    expect(questions).toEqual([
      {
        question_text: "Where do the light reactions happen?",
        choices: ["Stroma", "Thylakoid membrane", "Nucleus", "Cytosol", "Cell wall"],
        correct_index: 1,
        explanation:
          "The light reactions run on the thylakoid membrane. The stroma hosts the Calvin cycle instead.",
      },
      {
        question_text: "Which gas is released?",
        choices: ["CO2", "N2", "O2", "H2", "CH4"],
        correct_index: 2,
        explanation: "Splitting water releases O2 as a by-product.",
      },
    ]);
  });

  it("rejects a question with the wrong number of Choices as invalid AI output", async () => {
    const prepared = await prepareQuiz(fromScratch);
    const ai = fakeAi({
      questions: [
        {
          question_text: "Q?",
          choices: ["A", "B", "C", "D"],
          correct_index: 0,
          explanation: "A is right.",
        },
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
        {
          question_text: "Q?",
          choices: ["A", "B", "C", "D", "E"],
          correct_index: 5,
          explanation: "A is right.",
        },
      ],
    });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
    });
  });

  it.each([
    ["missing", {}],
    ["empty", { explanation: "  " }],
    ["not text", { explanation: 42 }],
  ])("rejects a question whose Explanation is %s as invalid AI output", async (_, extra) => {
    const prepared = await prepareQuiz(fromScratch);
    const ai = fakeAi({
      questions: [
        {
          question_text: "Q1?",
          choices: ["A", "B", "C", "D", "E"],
          correct_index: 0,
          explanation: "A is right.",
        },
        { question_text: "Q2?", choices: ["A", "B", "C", "D", "E"], correct_index: 1, ...extra },
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

describe("generateQuiz from Notes", () => {
  it("passes the text of a PDF to the AI client", async () => {
    const { ai, prompts } = recordingAi(oneValidQuestion);

    const prepared = await prepareQuiz(notes("notes.pdf", PDF));
    const questions = await generateQuiz(prepared, { ai });

    expect(prompts[0].user).toContain("Mitochondria make ATP.");
    expect(prompts[0].user).toContain("Ribosomes build proteins.");
    expect(questions).toEqual(oneValidQuestion.questions);
  });

  it("passes the text of a DOCX and the focus text to the AI client", async () => {
    const { ai, prompts } = recordingAi(oneValidQuestion);

    const prepared = await prepareQuiz(notes("notes.docx", DOCX, "Only chlorophyll"));
    await generateQuiz(prepared, { ai });

    expect(prompts[0].user).toContain("Photosynthesis happens in chloroplasts.");
    expect(prompts[0].user).toContain("Only chlorophyll");
  });

  it("prices the extracted text plus the focus text", async () => {
    const prepared = await prepareQuiz(notes("notes.docx", DOCX, "Only chlorophyll"));

    expect(prepared.pricedText.join(" ")).toContain("Chlorophyll absorbs light.");
    expect(prepared.pricedText).toContain("Only chlorophyll");
  });

  it("rejects a Notes question without 5 Choices as invalid AI output", async () => {
    const prepared = await prepareQuiz(notes("notes.pdf", PDF));
    const ai = fakeAi({
      questions: [
        { question_text: "Q?", choices: ["A", "B"], correct_index: 0, explanation: "A." },
      ],
    });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
    });
  });

  it("rejects a file that isn't a PDF or DOCX", async () => {
    await expect(prepareQuiz(notes("notes.pdf", "image/png"))).rejects.toMatchObject({
      kind: "unsupported_file_type",
    });
  });

  it("rejects a file over 4 MB", async () => {
    const input: GenerateQuizInput = {
      title: "Big",
      source: {
        kind: "notes",
        document: { bytes: new Uint8Array(4 * 1024 * 1024 + 1), mimeType: PDF },
      },
      questionCount: 1,
    };

    await expect(prepareQuiz(input)).rejects.toMatchObject({ kind: "file_too_large" });
  });

  it.each([
    ["a PDF with no text, like a scan", "blank.pdf", PDF],
    ["an empty DOCX", "empty.docx", DOCX],
    ["a file that isn't really a PDF", "notes.docx", PDF],
  ])("rejects %s as having no readable text", async (_, name, mimeType) => {
    await expect(prepareQuiz(notes(name, mimeType))).rejects.toMatchObject({
      kind: "no_readable_text",
    });
  });

  it("rejects a document with over 40,000 characters of text as too long", async () => {
    await expect(prepareQuiz(notes("long.docx", DOCX))).rejects.toMatchObject({
      kind: "text_too_long",
    });
  });
});

const sampleTest: GenerateQuizInput = {
  title: "Biology practice test",
  source: { kind: "sampleTest", document: { bytes: fixture("sample-test.pdf"), mimeType: PDF } },
  questionCount: 10,
};

describe("generateQuiz from a Sample Test", () => {
  it("keeps 2-, 4-, and 5-Choice questions as returned", async () => {
    const returned = [
      {
        question_text: "True or False: Ribosomes build proteins.",
        choices: ["True", "False"],
        correct_index: 0,
        explanation: "Ribosomes translate mRNA into proteins.",
      },
      {
        question_text: "What makes ATP?",
        choices: ["Mitochondria", "Ribosomes", "Nucleus", "Golgi"],
        correct_index: 0,
        explanation: "Mitochondria make ATP.",
      },
      {
        question_text: "Which organelle holds DNA?",
        choices: ["Nucleus", "Ribosome", "Vacuole", "Golgi", "Lysosome"],
        correct_index: 0,
        explanation: "The nucleus stores the cell's DNA.",
      },
    ];
    const { ai, prompts } = recordingAi({ questions: returned });

    const prepared = await prepareQuiz(sampleTest);
    const questions = await generateQuiz(prepared, { ai });

    expect(prompts[0].user).toContain("1. What makes ATP?");
    expect(questions).toEqual(returned);
  });

  it("trims a 6-Choice question to 5 and keeps the correct Choice", async () => {
    const prepared = await prepareQuiz(sampleTest);
    const ai = fakeAi({
      questions: [
        {
          question_text: "Which is a noble gas?",
          choices: ["Oxygen", "Nitrogen", "Carbon", "Iron", "Sodium", "Neon"],
          correct_index: 5,
          explanation: "Neon is a noble gas.",
        },
      ],
    });

    const [question] = await generateQuiz(prepared, { ai });

    expect(question.choices).toEqual(["Oxygen", "Nitrogen", "Carbon", "Iron", "Neon"]);
    expect(question.correct_index).toBe(4);
  });

  it("reports no questions found when the document has none", async () => {
    const prepared = await prepareQuiz(sampleTest);

    await expect(
      generateQuiz(prepared, { ai: fakeAi({ questions: [] }) }),
    ).rejects.toMatchObject({ kind: "no_questions_found" });
  });

  it("suggests Notes when no questions are found", async () => {
    const prepared = await prepareQuiz(sampleTest);
    const error = await generateQuiz(prepared, { ai: fakeAi({ questions: [] }) }).catch(
      (e) => e,
    );

    expect(error.toResponseBody().error).toContain("Notes");
  });

  it("reports too many questions when the document has over 50", async () => {
    const prepared = await prepareQuiz(sampleTest);
    const question = {
      question_text: "Q?",
      choices: ["True", "False"],
      correct_index: 0,
      explanation: "It's true.",
    };

    await expect(
      generateQuiz(prepared, { ai: fakeAi({ questions: Array(51).fill(question) }) }),
    ).rejects.toMatchObject({ kind: "too_many_questions" });
    await expect(
      generateQuiz(prepared, { ai: fakeAi({ questions: Array(50).fill(question) }) }),
    ).resolves.toHaveLength(50);
  });

  it("rejects a Sample Test question with only 1 Choice as invalid AI output", async () => {
    const prepared = await prepareQuiz(sampleTest);
    const ai = fakeAi({
      questions: [
        { question_text: "Q?", choices: ["A"], correct_index: 0, explanation: "A." },
      ],
    });

    await expect(generateQuiz(prepared, { ai })).rejects.toMatchObject({
      kind: "invalid_ai_output",
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
