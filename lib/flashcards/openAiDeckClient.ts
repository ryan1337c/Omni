import OpenAI from "openai";

import type { DeckAiClient } from "./generateDeck";

const DECK_MODEL = "gpt-5.1";

export function createOpenAiDeckClient(
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
): DeckAiClient {
  return {
    async complete({ system, user }) {
      const completion = await openai.chat.completions.create({
        model: DECK_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return completion.choices[0]?.message.content ?? null;
    },
  };
}
