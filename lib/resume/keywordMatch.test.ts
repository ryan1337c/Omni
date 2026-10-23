import { describe, expect, it } from "vitest";

import { fakeJev, type FakeJevAnswers } from "./fakeJev";
import { scoreKeywords } from "./jevScore";
import { scoreKeywordEvidence, type ResumeScore } from "./keywordMatch";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword, ResumeContent } from "./schema";

const NOW = new Date("2026-10-01T00:00:00Z");

const MENTIONED = 1;
const FAMILIARITY = 2;
const APPLIED = 3;

function keyword(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "hard", importance: "required" };
}

function other(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "other", importance: "required" };
}

/** Jev rates every Explicit Skill at this Depth Level. */
function ratedAt(level: number): FakeJevAnswers {
  return { score: level - 1 };
}

/** Jev answers every Other Keyword with this Match Probability. */
function matchProbability(noul: number): FakeJevAnswers {
  return { noul };
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

async function scoreWithJev(
  keywords: JdKeyword[],
  answers: FakeJevAnswers,
  resume: ResumeContent,
): Promise<ResumeScore> {
  const jev = fakeJev(answers);
  const scoring = await scoreKeywords(keywords, resume, { apiKey: "test", fetch: jev.fetch });
  return scoreKeywordEvidence(keywords, scoring.evidence, resume, { now: NOW });
}

async function creditFor(term: JdKeyword, answers: FakeJevAnswers, resume: ResumeContent) {
  return (await scoreWithJev([term], answers, resume)).results[0].weight;
}

describe("Keyword credit", () => {
  it("gives an Implied Skill no credit even when Jev rates it Applied / Production", async () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Deployed services on ECS and Lambda"])],
    });

    const score = await scoreWithJev([keyword("AWS")], ratedAt(APPLIED), resume);

    expect(score.results[0].weight).toBe(0);
    expect(score.results[0].matched).toBe(false);
    expect(score.score).toBe(0);
  });

  it("scores a skill found only in the Technical Skills section as a Skills Listing (0.4)", async () => {
    const resume = resumeWith({ skills: [{ category: "Languages", items: "Python, Go" }] });

    expect(await creditFor(keyword("Python"), ratedAt(MENTIONED), resume)).toBeCloseTo(0.4 / 3);
    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(0.4);
  });

  it("scores a skill named only in an Education Entry as a Skills Listing (0.4)", async () => {
    const resume = resumeWith({
      education: [
        { institution: "York University", location: "", degree: "BS", dates: "2018 - 2022", bullets: ["Coursework: React"] },
      ],
    });

    expect(await creditFor(keyword("React"), ratedAt(APPLIED), resume)).toBeCloseTo(0.4);
  });

  it("gives full placement weight to a Current Role held for 3+ years", async () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Shipped 14 Python microservices"])],
    });

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(1);
    expect(await creditFor(keyword("Python"), ratedAt(MENTIONED), resume)).toBeCloseTo(1 / 3);
  });

  it("scores a skill by its best Placement", async () => {
    const resume = resumeWith({
      experience: [
        job("Jan 2008 - Dec 2014", ["Built Python data pipelines"]),
        job("Jan 2022 - Present", ["Python scripts"]),
      ],
    });

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(1);
  });

  it("decays an older role by 0.1 per year since it ended, down to 0.5", async () => {
    const endedThreeYearsAgo = resumeWith({
      experience: [job("Jan 2018 - Oct 2023", ["Built Python data pipelines"])],
    });
    const endedLongAgo = resumeWith({
      experience: [job("Jan 2008 - Dec 2014", ["Built Python data pipelines"])],
    });

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), endedThreeYearsAgo)).toBeCloseTo(0.7);
    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), endedLongAgo)).toBeCloseTo(0.5);
  });

  it("scales by Duration from 0.8 under a year to 1.0 at three years", async () => {
    const sixMonths = resumeWith({ experience: [job("Apr 2026 - Present", ["Python APIs"])] });
    const twoYears = resumeWith({ experience: [job("Oct 2024 - Present", ["Python APIs"])] });

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), sixMonths)).toBeCloseTo(0.8);
    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), twoYears)).toBeCloseTo(0.9);
  });

  it("never lets a Work History placement fall to the Skills Listing weight", async () => {
    const shortAndOld = resumeWith({
      experience: [job("Jan 2012 - Jun 2012", ["Python scripts"])],
    });

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), shortAndOld)).toBeCloseTo(0.5);
  });

  it("ignores a term that appears only in a company name, location, or school name", async () => {
    const resume = resumeWith({
      experience: [{ title: "Analyst", company: "Salesforce", location: "Austin", dates: "Jan 2022 - Present", bullets: [] }],
      education: [{ institution: "Salesforce Academy", location: "", degree: "BS", dates: "", bullets: [] }],
    });

    expect(await creditFor(keyword("Salesforce"), ratedAt(APPLIED), resume)).toBe(0);
  });

  it.each(["Summer internship", "2019", "Mar 2023", ""])(
    "gives unreadable dates (%j) the minimum Work History weight",
    async (dates) => {
      const resume = resumeWith({ experience: [job(dates, ["Python scripts"])] });

      expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(0.5);
    },
  );

  it.each(["Jan 2018 -- Oct 2023", "Jan 2018 − Oct 2023", "Jan 2018—Oct 2023"])(
    "reads %j as a date range",
    async (dates) => {
      const resume = resumeWith({ experience: [job(dates, ["Python scripts"])] });

      expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(0.7);
    },
  );

  it.each(["Jan 2023 -", "2023 – Current", "01/2023 to now", "May 2021 – Ongoing", "2022 - Today"])(
    "treats %j as a Current Role",
    async (dates) => {
      const resume = resumeWith({ experience: [job(dates, ["Python scripts"])] });

      expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(1);
    },
  );

  it("caps a Project below a Current Role at 0.8, and decays it like a job", async () => {
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

    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), ongoing)).toBeCloseTo(0.8);
    expect(await creditFor(keyword("Python"), ratedAt(APPLIED), endedThreeYearsAgo)).toBeCloseTo(0.7);
  });

  describe("Dual Placement", () => {
    const skills = [{ category: "Languages", items: "Python" }];

    it("adds 0.1 when the skill is in both a current job and the Skills section", async () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Python microservices"])],
        skills,
      });

      expect(await creditFor(keyword("Python"), ratedAt(FAMILIARITY), resume)).toBeCloseTo(2 / 3 + 0.1);
    });

    it("counts a Project as Work History for the bonus", async () => {
      const resume = resumeWith({
        projects: [{ name: "Tracker", technologies: "Python", dates: "Jan 2022 - Present", bullets: [] }],
        skills,
      });

      expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBeCloseTo(0.9);
    });

    it("counts an Education Entry as a Skills Listing for the bonus", async () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Python microservices"])],
        education: [{ institution: "York University", location: "", degree: "BS", dates: "", bullets: ["Python coursework"] }],
      });

      expect(await creditFor(keyword("Python"), ratedAt(FAMILIARITY), resume)).toBeCloseTo(2 / 3 + 0.1);
    });

    it("never takes a keyword above full credit", async () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Python microservices"])],
        skills,
      });

      expect(await creditFor(keyword("Python"), ratedAt(APPLIED), resume)).toBe(1);
    });
  });

  describe("Other Keywords", () => {
    const degree = resumeWith({
      education: [
        {
          institution: "York University",
          location: "Toronto, ON",
          degree: "Bachelor of Science in Computer Science, Honours",
          dates: "Expected May 2026",
          bullets: [],
        },
      ],
    });

    it("gives full credit at a Match Probability of 0.9, ignoring Placement and literal wording", async () => {
      const score = await scoreWithJev([other("BS in Computer Science")], matchProbability(0.95), degree);

      expect(score.results[0].weight).toBe(1);
      expect(score.results[0].matched).toBe(true);
      expect(score.score).toBe(100);
    });

    it("gives no credit below a Match Probability of 0.5", async () => {
      const score = await scoreWithJev([other("MS in Computer Science")], matchProbability(0.45), degree);

      expect(score.results[0].weight).toBe(0);
      expect(score.results[0].matched).toBe(false);
    });

    it("scales linearly between 0.5 and 0.9", async () => {
      expect(await creditFor(other("1-3+ years of experience"), matchProbability(0.7), degree)).toBeCloseTo(0.5);
    });

    it("reports the Match Probability as the result's level", async () => {
      const score = await scoreWithJev([other("BS in Computer Science")], matchProbability(0.8), degree);

      expect(score.results[0].level).toBe(0.8);
    });
  });
});
