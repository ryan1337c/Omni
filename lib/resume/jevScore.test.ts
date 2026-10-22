import { describe, expect, it } from "vitest";

import { scoreKeywords } from "./jevScore";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword } from "./schema";

function keyword(term: string, category: JdKeyword["category"] = "hard"): JdKeyword {
  return { term, aliases: [], category, importance: "required" };
}

const resume = parseResumeContent({
  header: { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" },
  education: [
    {
      institution: "York University",
      location: "Toronto, ON",
      degree: "Bachelor of Science in Computer Science",
      dates: "2018 - 2022",
      bullets: [],
    },
  ],
  experience: [
    {
      title: "Software Engineer",
      company: "Acme",
      location: "Remote",
      dates: "Jan 2022 - Present",
      bullets: ["Shipped Python microservices on ECS and Lambda"],
    },
  ],
});

type JevQuestion = { type: string; instructions: string };
type JevRequest = { questions: Record<string, JevQuestion> };

/** Answers every depth question with `score` (0–2) and every match question with `noul`, and records what was asked. */
function fakeJev({ score = 2, noul = 0.95 }: { score?: number; noul?: number } = {}) {
  const requests: JevRequest[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as JevRequest;
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

async function withQuietConsole<T>(run: () => Promise<T>): Promise<T> {
  const quiet = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = quiet;
  }
}

describe("scoreKeywords", () => {
  it("asks Jev only about Explicit Skills and reports Implied Skills as Absent", async () => {
    const jev = fakeJev({ score: 2 });

    const scoring = await scoreKeywords([keyword("AWS"), keyword("Python")], resume, {
      apiKey: "test",
      fetch: jev.fetch,
    });

    const asked = Object.values(jev.requests[0].questions).map((q) => q.instructions);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("Python");
    expect(scoring).toEqual({ levels: [0, 3], scoredBy: "jev" });
  });

  it("asks a yes/no question for every Other Keyword, even one never named literally", async () => {
    const jev = fakeJev({ noul: 0.93 });

    const scoring = await scoreKeywords([keyword("BS in Computer Science", "other")], resume, {
      apiKey: "test",
      fetch: jev.fetch,
    });

    const [question] = Object.values(jev.requests[0].questions);
    expect(question.type).toBe("noul");
    expect(question.instructions).toContain("BS in Computer Science");
    expect(scoring).toEqual({ levels: [0.93], scoredBy: "jev" });
  });

  it("asks depth and match questions in one request", async () => {
    const jev = fakeJev();

    await scoreKeywords([keyword("Python"), keyword("BS in Computer Science", "other")], resume, {
      apiKey: "test",
      fetch: jev.fetch,
    });

    expect(jev.requests).toHaveLength(1);
    const types = Object.values(jev.requests[0].questions).map((q) => q.type);
    expect(types).toEqual(["score", "noul"]);
  });

  it("falls back to Mentioned for Explicit Skills and literal matching for Other Keywords when Jev fails", async () => {
    const failing = (async () => new Response("", { status: 503 })) as typeof globalThis.fetch;

    const scoring = await withQuietConsole(() =>
      scoreKeywords(
        [
          keyword("AWS"),
          keyword("Python"),
          keyword("Bachelor of Science in Computer Science", "other"),
          keyword("BS in Computer Science", "other"),
        ],
        resume,
        { apiKey: "test", fetch: failing },
      ),
    );

    expect(scoring).toEqual({ levels: [0, 1, 1, 0], scoredBy: "keyword" });
  });
});
