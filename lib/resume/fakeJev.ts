import { ENTRY_FIELDS } from "./entryFields";
import { scoreKeywords } from "./jevScore";
import { scoreKeywordEvidence, type ResumeScore } from "./keywordMatch";
import type { JdKeyword, KeywordScoring, ResumeContent } from "./schema";

type JevQuestion = { type: string; instructions: string };
export type FakeJevRequest = { state: Record<string, unknown>; questions: Record<string, JevQuestion> };

export type FakeJevAnswers = {
  /** Answer to every Depth Level question, 0–2 (Depth Level − 1). */
  score?: number;
  /** Answer to every yes/no question, 0–1: presence in an Entry request, Match Probability otherwise. */
  noul?: number;
  /** Yes/no answer, by Bullet text, to questions that point at that Bullet; other Bullets get `noul`. */
  bullets?: Record<string, number>;
  /** Respond 503 instead of answering. */
  fail?: boolean;
};

type AnswerFor = (request: FakeJevRequest) => FakeJevAnswers;

const BULLET_PATH = /`bullets\[(\d+)\]`/;

/** The text of the Bullet a question points at by its state path, if any. */
function bulletText(request: FakeJevRequest, question: JevQuestion): string | undefined {
  const path = BULLET_PATH.exec(question.instructions);
  const bullets = request.state.bullets;
  if (!path || !Array.isArray(bullets)) return undefined;
  const text = bullets[Number(path[1])];
  return typeof text === "string" ? text : undefined;
}

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
    const { score = 2, noul = 0.95, bullets = {}, fail = false } = answerFor(body);
    if (fail) return new Response("", { status: 503 });
    const noulFor = (question: JevQuestion) => {
      const text = bulletText(body, question);
      return text !== undefined && text in bullets ? bullets[text] : noul;
    };
    const answers = Object.fromEntries(
      Object.entries(body.questions).map(([key, question]) => [
        key,
        question.type === "noul" ? { type: "noul", noul: noulFor(question) } : { type: "score", score },
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
  for (const { name } of Object.values(ENTRY_FIELDS)) {
    const label = request.state[name];
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

/** "Now" for Recency and Current Roles in scoring tests. */
export const SCORED_AT = new Date("2026-10-01T00:00:00Z");

/**
 * The scoring seam: `scoreKeywords` against a fake Jev, then credit at `SCORED_AT`. Also returns
 * which scorer ran and the requests Jev received.
 */
export async function scoreWithJev(
  keywords: JdKeyword[],
  answers: FakeJevAnswers | AnswerFor,
  resume: ResumeContent,
): Promise<ResumeScore & { scoredBy: KeywordScoring["scoredBy"]; requests: FakeJevRequest[] }> {
  const jev = fakeJev(answers);
  const scoring = await scoreKeywords(keywords, resume, { apiKey: "test", fetch: jev.fetch });
  const score = scoreKeywordEvidence(keywords, scoring.evidence, resume, { now: SCORED_AT });
  return { ...score, scoredBy: scoring.scoredBy, requests: jev.requests };
}

/** Runs a fallback path without its expected `console.error` in the test output. */
export async function withQuietConsole<T>(run: () => Promise<T>): Promise<T> {
  const error = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = error;
  }
}
