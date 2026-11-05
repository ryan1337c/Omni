import type { StoredFigure } from "@/lib/quiz/figureRules";

import type { ManualQuestion } from "./types";

export type SavedQuestion = {
  id: string | number;
  question_text: string;
  question_type?: string | null;
  explanation?: string | null;
  choices: { choice_text: string; is_correct: boolean }[];
  figures?: StoredFigure[];
};

export function toManualQuestion(saved: SavedQuestion): ManualQuestion {
  return {
    id: String(saved.id),
    question_text: saved.question_text,
    type: "multiple_choice",
    choices: saved.choices.map((c) => c.choice_text),
    correct_index: saved.choices.findIndex((c) => c.is_correct),
    explanation: saved.explanation ?? "",
    figures: (saved.figures ?? []).map((figure) => ({ kind: "stored", ...figure })),
  };
}
