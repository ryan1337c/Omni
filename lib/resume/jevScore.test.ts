import { describe, expect, it } from "vitest";

import { entryName, failingJev, fakeJev } from "./fakeJev";
import { scoreKeywords } from "./jevScore";
import { scoreKeywordEvidence } from "./keywordMatch";
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
  return { scoring, score: scoreKeywordEvidence(keywords, scoring.evidence, resume, { now: NOW }) };
}

describe("scoreKeywords", () => {
  it("still asks about Soft Skills only when they are Explicit, on the whole resume", async () => {
    const jev = fakeJev({ score: 2 });

    const { scoring, score } = await scoreWith([keyword("Teamwork", "soft")], jev.fetch);

    expect(jev.requests).toHaveLength(0);
    expect(scoring.scoredBy).toBe("jev");
    expect(score.results.map((r) => [r.level, r.weight, r.matched])).toEqual([[0, 0, false]]);
  });

  it("carries each Keyword's evidence: Placements, Explicit or not, and Match Probability", async () => {
    const jev = fakeJev({ score: 1, noul: 0.93 });
    const listed = { ...resume, skills: [{ category: "Languages", items: "Python" }] };

    const scoring = await scoreKeywords(
      [keyword("Python"), keyword("AWS"), keyword("BS in Computer Science", "other")],
      listed,
      { apiKey: "test", fetch: jev.fetch },
    );

    expect(scoring.evidence).toEqual([
      {
        kind: "skill",
        explicit: true,
        placements: [
          { source: { section: "experience", entry: 0 }, presence: 0.93, depthLevel: 2 },
          { source: { section: "skillsListing" }, presence: 1, depthLevel: 2 },
        ],
        demonstratingBullets: [],
      },
      {
        kind: "skill",
        explicit: false,
        placements: [{ source: { section: "experience", entry: 0 }, presence: 0.93, depthLevel: 2 }],
        demonstratingBullets: [],
      },
      { kind: "other", matchProbability: 0.93 },
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

  it("sends each Experience and Projects Entry as its own request, plus one whole-resume request", async () => {
    const jev = fakeJev();
    const twoJobsAndAProject = {
      ...resume,
      experience: [
        { title: "Staff Engineer", company: "Acme", location: "", dates: "Jan 2022 - Present", bullets: ["Ran services on EKS"] },
        { title: "Developer", company: "Initech", location: "", dates: "2018 - 2021", bullets: ["Wrote Go-to-market reports"] },
      ],
      projects: [{ name: "Tracker", technologies: "Flask", dates: "2020 - 2021", bullets: ["Built a REST API"] }],
    };

    await scoreKeywords([keyword("Kubernetes"), keyword("BS in Computer Science", "other")], twoJobsAndAProject, {
      apiKey: "test",
      fetch: jev.fetch,
    });

    expect(jev.requests.map(entryName).sort()).toEqual(["Developer", "Staff Engineer", "Tracker", undefined]);
    const staff = jev.requests.find((request) => entryName(request) === "Staff Engineer")!;
    const staffState = JSON.stringify(staff.state);
    expect(staffState).toContain("Ran services on EKS");
    expect(staffState).not.toContain("Initech");
    expect(staffState).not.toContain("Tracker");
    expect(staffState).not.toContain("York University");
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
