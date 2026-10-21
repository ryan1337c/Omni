import { describe, expect, it } from "vitest";

import { scoreKeywordLevels } from "./keywordMatch";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword } from "./schema";

const NOW = new Date("2026-10-01T00:00:00Z");

const ABSENT = 0;
const MENTIONED = 1;
const APPLIED = 3;
const ADVANCED = 4;

function keyword(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "hard", importance: "required" };
}

function resumeWith(sections: Record<string, unknown>) {
  return parseResumeContent({
    header: { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" },
    ...sections,
  });
}

function job(dates: string, bullets: string[], title = "Software Engineer") {
  return { title, company: "Acme", location: "Remote", dates, bullets };
}

function creditFor(term: JdKeyword, level: number, resume: ReturnType<typeof resumeWith>): number {
  return scoreKeywordLevels([term], [level], resume, { now: NOW }).results[0].weight;
}

describe("scoreKeywordLevels", () => {
  it("gives an Implied Skill no credit even when Jev rates it Advanced", () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Deployed services on ECS and Lambda"])],
    });

    const score = scoreKeywordLevels([keyword("AWS")], [ADVANCED], resume, { now: NOW });

    expect(score.results[0].weight).toBe(0);
    expect(score.results[0].matched).toBe(false);
    expect(score.score).toBe(0);
  });

  it("scores a skill found only in the Technical Skills section as a Skills Listing (0.4)", () => {
    const resume = resumeWith({ skills: [{ category: "Languages", items: "Python, Go" }] });

    expect(creditFor(keyword("Python"), MENTIONED, resume)).toBeCloseTo(0.1);
    expect(creditFor(keyword("Python"), ADVANCED, resume)).toBeCloseTo(0.4);
  });

  it("gives full placement weight to a Current Role held for 3+ years", () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Shipped 14 Python microservices"])],
    });

    expect(creditFor(keyword("Python"), ADVANCED, resume)).toBeCloseTo(1);
    expect(creditFor(keyword("Python"), MENTIONED, resume)).toBeCloseTo(0.25);
  });

  it("decays an older role by 0.1 per year since it ended, down to 0.5", () => {
    const endedThreeYearsAgo = resumeWith({
      experience: [job("Jan 2018 - Oct 2023", ["Built Python data pipelines"])],
    });
    const endedLongAgo = resumeWith({
      experience: [job("Jan 2008 - Dec 2014", ["Built Python data pipelines"])],
    });

    expect(creditFor(keyword("Python"), ADVANCED, endedThreeYearsAgo)).toBeCloseTo(0.7);
    expect(creditFor(keyword("Python"), ADVANCED, endedLongAgo)).toBeCloseTo(0.5);
  });

  it("scales by Duration from 0.8 under a year to 1.0 at three years", () => {
    const sixMonths = resumeWith({ experience: [job("Apr 2026 - Present", ["Python APIs"])] });
    const twoYears = resumeWith({ experience: [job("Oct 2024 - Present", ["Python APIs"])] });

    expect(creditFor(keyword("Python"), ADVANCED, sixMonths)).toBeCloseTo(0.8);
    expect(creditFor(keyword("Python"), ADVANCED, twoYears)).toBeCloseTo(0.9);
  });

  it("never lets a Work History placement fall to the Skills Listing weight", () => {
    const shortAndOld = resumeWith({
      experience: [job("Jan 2012 - Jun 2012", ["Python scripts"])],
    });

    expect(creditFor(keyword("Python"), ADVANCED, shortAndOld)).toBeCloseTo(0.5);
  });

  it.each(["Summer internship", "2019", ""])(
    "gives unreadable dates (%j) the minimum Work History weight",
    (dates) => {
      const resume = resumeWith({ experience: [job(dates, ["Python scripts"])] });

      expect(creditFor(keyword("Python"), ADVANCED, resume)).toBeCloseTo(0.5);
    },
  );

  it.each(["Jan 2023 -", "2023 – Current", "01/2023 to now"])(
    "treats %j as a Current Role",
    (dates) => {
      const resume = resumeWith({ experience: [job(dates, ["Python scripts"])] });

      expect(creditFor(keyword("Python"), ADVANCED, resume)).toBeCloseTo(1);
    },
  );

  it("caps a Project below a Current Role at 0.8, and decays it like a job", () => {
    const ongoing = resumeWith({
      projects: [
        { name: "Tracker", technologies: "Python, Flask", dates: "Jan 2022 - Present", bullets: [] },
      ],
    });
    const endedThreeYearsAgo = resumeWith({
      projects: [
        { name: "Tracker", technologies: "", dates: "Jan 2018 - Oct 2023", bullets: ["Wrote it in Python"] },
      ],
    });

    expect(creditFor(keyword("Python"), ADVANCED, ongoing)).toBeCloseTo(0.8);
    expect(creditFor(keyword("Python"), ADVANCED, endedThreeYearsAgo)).toBeCloseTo(0.7);
  });

  describe("Dual Placement", () => {
    const skills = [{ category: "Languages", items: "Python" }];

    it("adds 0.1 when the skill is in both a current job and the Skills section", () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Python microservices"])],
        skills,
      });

      expect(creditFor(keyword("Python"), APPLIED, resume)).toBeCloseTo(0.85);
    });

    it("counts a Project as Work History for the bonus", () => {
      const resume = resumeWith({
        projects: [{ name: "Tracker", technologies: "Python", dates: "Jan 2022 - Present", bullets: [] }],
        skills,
      });

      expect(creditFor(keyword("Python"), ADVANCED, resume)).toBeCloseTo(0.9);
    });

    it("never takes a keyword above full credit", () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Python microservices"])],
        skills,
      });

      expect(creditFor(keyword("Python"), ADVANCED, resume)).toBe(1);
    });
  });
});
