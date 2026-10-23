import { describe, expect, it } from "vitest";

import { failingJev, fakeJev } from "./fakeJev";
import { scoreKeywords } from "./jevScore";
import { scoreKeywordLevels } from "./keywordMatch";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword } from "./schema";

function keyword(term: string, category: JdKeyword["category"] = "hard"): JdKeyword {
  return { term, aliases: [], category, importance: "required" };
}

const NOW = new Date("2026-10-01T00:00:00Z");

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

async function withQuietConsole<T>(run: () => Promise<T>): Promise<T> {
  const quiet = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = quiet;
  }
}

async function scoreWith(keywords: JdKeyword[], fetch: typeof globalThis.fetch) {
  const scoring = await scoreKeywords(keywords, resume, { apiKey: "test", fetch });
  return { scoring, score: scoreKeywordLevels(keywords, scoring.levels, resume, { now: NOW }) };
}

describe("scoreKeywords", () => {
  it("asks Jev only about Explicit Skills and reports Implied Skills as Absent", async () => {
    const jev = fakeJev({ score: 2 });

    const { scoring, score } = await scoreWith([keyword("AWS"), keyword("Python")], jev.fetch);

    const asked = Object.values(jev.requests[0].questions).map((q) => q.instructions);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("Python");
    expect(scoring.scoredBy).toBe("jev");
    expect(score.results.map((r) => [r.level, r.weight, r.matched])).toEqual([
      [0, 0, false],
      [3, 1, true],
    ]);
  });

  it("asks a yes/no question for every Other Keyword, even one never named literally", async () => {
    const jev = fakeJev({ noul: 0.93 });

    const { score } = await scoreWith([keyword("BS in Computer Science", "other")], jev.fetch);

    const [question] = Object.values(jev.requests[0].questions);
    expect(question.type).toBe("noul");
    expect(question.instructions).toContain("BS in Computer Science");
    expect(score.results[0].level).toBe(0.93);
    expect(score.results[0].weight).toBe(1);
  });

  it("asks depth and match questions in one request", async () => {
    const jev = fakeJev();

    await scoreWith([keyword("Python"), keyword("BS in Computer Science", "other")], jev.fetch);

    expect(jev.requests).toHaveLength(1);
    const types = Object.values(jev.requests[0].questions).map((q) => q.type);
    expect(types).toEqual(["score", "noul"]);
  });

  it("falls back to Mentioned for Explicit Skills and literal matching for Other Keywords when Jev fails", async () => {
    const { scoring, score } = await withQuietConsole(() =>
      scoreWith(
        [
          keyword("AWS"),
          keyword("Python"),
          keyword("Bachelor of Science in Computer Science", "other"),
          keyword("BS in Computer Science", "other"),
        ],
        failingJev,
      ),
    );

    expect(scoring.scoredBy).toBe("keyword");
    expect(score.results.map((r) => [r.level, r.matched])).toEqual([
      [0, false],
      [1, true],
      [1, true],
      [0, false],
    ]);
  });
});
