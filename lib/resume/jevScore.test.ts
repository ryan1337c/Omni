import { describe, expect, it } from "vitest";

import { scoreKeywords } from "./jevScore";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword } from "./schema";

function keyword(term: string): JdKeyword {
  return { term, aliases: [], category: "hard", importance: "required" };
}

const resume = parseResumeContent({
  header: { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" },
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

type JevRequest = { questions: Record<string, { instructions: string }> };

/** Answers every question with the same Jev score (0–3) and records what was asked. */
function fakeJev(score: number) {
  const requests: JevRequest[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as JevRequest;
    requests.push(body);
    const answers = Object.fromEntries(Object.keys(body.questions).map((key) => [key, { score }]));
    return new Response(JSON.stringify({ answers }), { status: 200 });
  }) as typeof globalThis.fetch;
  return { fetch, requests };
}

describe("scoreKeywords", () => {
  it("asks Jev only about Explicit Skills and reports Implied Skills as Absent", async () => {
    const jev = fakeJev(3);

    const scoring = await scoreKeywords([keyword("AWS"), keyword("Python")], resume, {
      apiKey: "test",
      fetch: jev.fetch,
    });

    const asked = Object.values(jev.requests[0].questions).map((q) => q.instructions);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("Python");
    expect(scoring).toEqual({ levels: [0, 4], scoredBy: "jev" });
  });

  it("falls back to Mentioned for Explicit Skills when Jev fails", async () => {
    const failing = (async () => new Response("", { status: 503 })) as typeof globalThis.fetch;
    const quiet = console.error;
    console.error = () => {};
    try {
      const scoring = await scoreKeywords([keyword("AWS"), keyword("Python")], resume, {
        apiKey: "test",
        fetch: failing,
      });

      expect(scoring).toEqual({ levels: [0, 1], scoredBy: "keyword" });
    } finally {
      console.error = quiet;
    }
  });
});
