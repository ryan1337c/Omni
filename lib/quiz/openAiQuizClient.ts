import OpenAI from "openai";

import type { QuizAiClient } from "./generateQuiz";

const QUIZ_MODEL = "gpt-5.1";

export function createOpenAiQuizClient(
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
): QuizAiClient {
  return {
    async complete({ system, user }) {
      const completion = await openai.chat.completions.create({
        model: QUIZ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return completion.choices[0]?.message.content ?? null;
    },
  };
}
