type JevQuestion = { type: string; instructions: string };
export type FakeJevRequest = { state: Record<string, unknown>; questions: Record<string, JevQuestion> };

export type FakeJevAnswers = {
  /** Answer to every Depth Level question, 0–2 (Depth Level − 1). */
  score?: number;
  /** Answer to every yes/no question, 0–1: presence in an Entry request, Match Probability otherwise. */
  noul?: number;
  /** Respond 503 instead of answering. */
  fail?: boolean;
};

type AnswerFor = (request: FakeJevRequest) => FakeJevAnswers;

/**
 * Test double for the Jev API: answers every question in a request with the same preset values
 * and records each request. Pass a function to answer differently per request (see `byEntry`).
 */
export function fakeJev(answers: FakeJevAnswers | AnswerFor = {}) {
  const answerFor: AnswerFor = typeof answers === "function" ? answers : () => answers;
  const requests: FakeJevRequest[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as FakeJevRequest;
    requests.push(body);
    const { score = 2, noul = 0.95, fail = false } = answerFor(body);
    if (fail) return new Response("", { status: 503 });
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

/**
 * The job title, project name, or institution of the one Entry in a request's state;
 * undefined for the whole-resume request.
 */
export function entryName(request: FakeJevRequest): string | undefined {
  const { title, name, institution } = request.state;
  for (const label of [title, name, institution]) {
    if (typeof label === "string") return label;
  }
  return undefined;
}

/**
 * Answers each Entry request by its job title, project name, or institution. Entries not listed,
 * and the whole-resume request, get `rest`.
 */
export function byEntry(entries: Record<string, FakeJevAnswers>, rest: FakeJevAnswers = {}): AnswerFor {
  return (request) => {
    const name = entryName(request);
    return (name !== undefined && entries[name]) || rest;
  };
}

export const failingJev = (async () => new Response("", { status: 503 })) as typeof globalThis.fetch;
