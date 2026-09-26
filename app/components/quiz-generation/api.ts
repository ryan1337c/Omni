import { AuthServices } from "@/lib/authServices";

const authServices = new AuthServices();

export async function generateQuizRequest(
  title: string,
  topic: string,
  questionCount: number | string,
) {
  const session = await authServices.getSession();
  const result = await fetch(`/api/generateQuiz`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title: title,
      topic: topic,
      questionCount: Number(questionCount),
    }),
  });

  const data = await result.json();
  return { result, data };
}
