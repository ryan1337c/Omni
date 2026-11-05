import type { StoredFigure } from "@/lib/quiz/figureRules";

export type Choice = {
  question_id?: number;
  choice_text: string;
  is_correct: boolean;
};

export type Question = {
  id: number;
  question_text: string;
  question_type: string;
  correct_answer: string;
  explanation?: string | null;
  choices: Choice[];
  figures?: StoredFigure[];
};

export type QuizActiveModalProps = {
  quizId: number;
  quizTitle: string;
  questions: Question[];
  duration: number;
  onExit: () => void;
};

export type QuizScore = {
  points: number;
  totalPoints: number;
  percentage: number;
};
