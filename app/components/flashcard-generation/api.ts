import { AuthServices } from "@/lib/authServices";

const authServices = new AuthServices();

export async function generateDeckRequest(
  title: string,
  description: string,
  topic: string,
  count: number | string,
) {
  const session = await authServices.getSession();
  const result = await fetch(`/api/generateDeck`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title,
      description,
      topic,
      count: Number(count),
    }),
  });

  const data = await result.json();
  return { result, data };
}
