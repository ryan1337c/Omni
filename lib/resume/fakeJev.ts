type JevQuestion = { type: string; instructions: string };
export type FakeJevRequest = { state: unknown; questions: Record<string, JevQuestion> };

export type FakeJevAnswers = {
  /** Answer to every Depth Level question, 0–2 (Depth Level − 1). */
  score?: number;
  /** Answer to every yes/no question, 0–1. */
  noul?: number;
};

/** Test double for the Jev API: answers every question with preset values and records each request. */
export function fakeJev({ score = 2, noul = 0.95 }: FakeJevAnswers = {}) {
  const requests: FakeJevRequest[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as FakeJevRequest;
    requests.push(body);
    const answers = Object.fromEntries(
      Object.entries(body.questions).map(([key, question]) => [
        key,
        question.type === "noul" ? { type: "noul", noul } : { type: "score", score },
      ]),
    );
    return new Response(JSON.stringify({ answers }), { status: 200 });
  }) as typeof globalThis.fetch;
  return { fetch, requests };
}

export const failingJev = (async () => new Response("", { status: 503 })) as typeof globalThis.fetch;
