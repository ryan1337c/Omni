import { describe, expect, it } from "vitest";

import { entryName, scoreWithJev, withQuietConsole } from "./fakeJev";
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

describe("scoreKeywords", () => {
  it("asks about Soft Skills inside the Entry requests, without adding a request", async () => {
    const hardOnly = await scoreWithJev([keyword("Python")], {}, resume);
    const withSoft = await scoreWithJev([keyword("Python"), keyword("Teamwork", "soft")], {}, resume);

    expect(withSoft.scoredBy).toBe("jev");
    expect(withSoft.requests.map(entryName)).toEqual(hardOnly.requests.map(entryName));
  });

  it("carries each Keyword's evidence: Placements, Explicit or not, and Match Probability", async () => {
    const listed = { ...resume, skills: [{ category: "Languages", items: "Python" }] };

    const { results } = await scoreWithJev(
      [keyword("Python"), keyword("AWS"), keyword("BS in Computer Science", "other")],
      { score: 1, noul: 0.93 },
      listed,
    );

    expect(results.map((result) => result.evidence)).toEqual([
      {
        kind: "skill",
        explicit: true,
        placements: [
          { source: { section: "experience", entry: 0 }, presence: 0.93, depthLevel: 2 },
          { source: { section: "skills" }, presence: 1, depthLevel: 1 },
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
    const { requests, results } = await scoreWithJev([keyword("BS in Computer Science", "other")], { noul: 0.93 }, resume);

    const [question] = Object.values(requests[0].questions);
    expect(question.type).toBe("noul");
    expect(question.instructions).toContain("BS in Computer Science");
    expect(results[0].level).toBe(0.93);
    expect(results[0].weight).toBe(1);
  });

  it("sends each Experience and Projects Entry as its own request, plus one whole-resume request", async () => {
    const twoJobsAndAProject = {
      ...resume,
      experience: [
        { title: "Staff Engineer", company: "Acme", location: "", dates: "Jan 2022 - Present", bullets: ["Ran services on EKS"] },
        { title: "Developer", company: "Initech", location: "", dates: "2018 - 2021", bullets: ["Wrote Go-to-market reports"] },
      ],
      projects: [{ name: "Tracker", technologies: "Flask", dates: "2020 - 2021", bullets: ["Built a REST API"] }],
    };

    const { requests } = await scoreWithJev(
      [keyword("Kubernetes"), keyword("BS in Computer Science", "other")],
      {},
      twoJobsAndAProject,
    );

    expect(requests.map(entryName).sort()).toEqual(["Developer", "Staff Engineer", "Tracker", undefined]);
    const staff = requests.find((request) => entryName(request) === "Staff Engineer")!;
    const staffState = JSON.stringify(staff.state);
    expect(staffState).toContain("Ran services on EKS");
    expect(staffState).not.toContain("Initech");
    expect(staffState).not.toContain("Tracker");
    expect(staffState).not.toContain("York University");
  });

  it("sends each Education Entry as its own request, asking only about the Hard Skills it names", async () => {
    const twoSchools = {
      ...resume,
      education: [
        { institution: "York University", location: "", degree: "BS", dates: "2018 - 2022", bullets: ["Built a React to-do app in a web development course"] },
        { institution: "Seneca College", location: "", degree: "Diploma", dates: "2016 - 2018", bullets: ["Wrote Java labs"] },
      ],
    };

    const { requests } = await scoreWithJev([keyword("React"), keyword("Java"), keyword("Kubernetes")], {}, twoSchools);

    const york = requests.find((request) => entryName(request) === "York University")!;
    const yorkState = JSON.stringify(york.state);
    expect(yorkState).toContain("React to-do app");
    expect(yorkState).not.toContain("Seneca");
    expect(yorkState).not.toContain("Acme");
    const asked = Object.values(york.questions).map((question) => question.instructions).join("\n");
    expect(asked).toContain("React");
    expect(asked).not.toContain("Java");
    expect(asked).not.toContain("Kubernetes");
  });

  it("never implies a skill from Education", async () => {
    const coursework = {
      ...resume,
      experience: [],
      education: [
        { institution: "York University", location: "", degree: "BS", dates: "2018 - 2022", bullets: ["Built a to-do app with JSX components and hooks"] },
      ],
    };

    const { results } = await scoreWithJev([keyword("React")], { score: 2, noul: 0.99 }, coursework);

    expect(results[0].evidence).toEqual({ kind: "skill", explicit: false, placements: [], demonstratingBullets: [] });
  });

  it("falls back to Mentioned for Explicit Skills and literal matching for Other Keywords when Jev fails", async () => {
    const keywords = [
      keyword("AWS"),
      keyword("Python"),
      keyword("Bachelor of Science in Computer Science", "other"),
      keyword("BS in Computer Science", "other"),
    ];

    const score = await withQuietConsole(() => scoreWithJev(keywords, { fail: true }, resume));

    expect(score.scoredBy).toBe("keyword");
    expect(score.results.map((r) => [r.level, r.matched])).toEqual([
      [0, false],
      [1, true],
      [1, true],
      [0, false],
    ]);
  });
});
