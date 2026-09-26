import type { Question, QuizScore } from "./types";

export const formatTime = (seconds: number) => {
  if (seconds < 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export function calculateScore(
  questions: Question[],
  selectedAnswers: Record<number, number>
): QuizScore {
  let correct = 0;
  questions.forEach((q, idx) => {
    const userAns = selectedAnswers[idx];
    if (userAns !== undefined && q.choices[userAns]?.is_correct) {
      correct++;
    }
  });
  const totalPoints = questions.length;
  const earnedPoints = correct;
  const percentage =
    questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  return {
    points: earnedPoints,
    totalPoints,
    percentage,
  };
}
