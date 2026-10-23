import { describe, expect, it } from "vitest";

import { byEntry, fakeJev, type FakeJevAnswers } from "./fakeJev";
import { scoreKeywords } from "./jevScore";
import { highlightedKeywords, scoreKeywordEvidence, type ResumeScore } from "./keywordMatch";
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
  answers: Parameters<typeof fakeJev>[0],
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
  it("gives an Implied Hard Skill at Applied / Production in a Current Role half the named credit", async () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Deployed services on ECS and Lambda"])],
    });

    const score = await scoreWithJev([keyword("AWS")], ratedAt(APPLIED), resume);

    expect(score.results[0].weight).toBeCloseTo(0.5);
    expect(score.results[0].level).toBe(APPLIED);
    expect(score.results[0].matched).toBe(true);
    expect(score.results[0].evidence).toMatchObject({ explicit: false });
  });

  it("trusts a Technical Skills match without asking Jev, as a Skills Listing at Mentioned", async () => {
    const resume = resumeWith({ skills: [{ category: "Languages", items: "Python, Go" }] });
    const jev = fakeJev({ ...ratedAt(APPLIED), noul: 0.05 });

    const scoring = await scoreKeywords([keyword("Go")], resume, { apiKey: "test", fetch: jev.fetch });
    const score = scoreKeywordEvidence([keyword("Go")], scoring.evidence, resume, { now: NOW });

    expect(jev.requests).toHaveLength(0);
    expect(score.results[0].level).toBe(MENTIONED);
    expect(score.results[0].weight).toBeCloseTo(0.4 / 3);
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

  it("does not count a term in a company name, location, or school name as naming the skill", async () => {
    const resume = resumeWith({
      experience: [{ title: "Analyst", company: "Salesforce", location: "Austin", dates: "Jan 2022 - Present", bullets: [] }],
      education: [{ institution: "Salesforce Academy", location: "", degree: "BS", dates: "", bullets: [] }],
    });

    const notShown = await scoreWithJev([keyword("Salesforce")], { ...ratedAt(APPLIED), noul: 0.1 }, resume);
    const shownUnnamed = await scoreWithJev([keyword("Salesforce")], ratedAt(APPLIED), resume);

    expect(notShown.results[0].weight).toBe(0);
    expect(shownUnnamed.results[0].evidence).toMatchObject({ explicit: false });
    expect(shownUnnamed.results[0].weight).toBeCloseTo(0.5);
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

  describe("judged by meaning, one Entry at a time", () => {
    it("counts a skill named in Technical Skills and shown unnamed in a Bullet in full, with the Dual Placement bonus", async () => {
      const resume = resumeWith({
        experience: [job("Jan 2022 - Present", ["Ran 30 services on EKS with Helm"])],
        skills: [{ category: "Tools", items: "Kubernetes" }],
      });

      const score = await scoreWithJev([keyword("Kubernetes")], ratedAt(FAMILIARITY), resume);

      expect(score.results[0].evidence).toMatchObject({ explicit: true });
      expect(score.results[0].weight).toBeCloseTo(2 / 3 + 0.1);
    });

    it("scores deep use in an old Entry and a mention in the Current Role by the best Placement", async () => {
      const resume = resumeWith({
        experience: [
          job("Jan 2022 - Present", ["Python scripts"], "Manager"),
          job("Jan 2008 - Dec 2014", ["Built Python data pipelines"], "Data Engineer"),
        ],
      });
      const answers = byEntry({ Manager: { score: MENTIONED - 1 }, "Data Engineer": { score: APPLIED - 1 } });

      const score = await scoreWithJev([keyword("Python")], answers, resume);

      expect(score.results[0].level).toBe(APPLIED);
      expect(score.results[0].weight).toBeCloseTo(0.5);
    });

    it("does not count a Placement whose presence is below 0.7", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", ["Ran services on EKS"])] });

      expect(await creditFor(keyword("Kubernetes"), { ...ratedAt(APPLIED), noul: 0.69 }, resume)).toBe(0);
      expect(await creditFor(keyword("Kubernetes"), { ...ratedAt(APPLIED), noul: 0.7 }, resume)).toBeCloseTo(0.5);
    });

    it("treats a literal match whose sense Jev rejects as Absent", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", ["Led the go-to-market launch"])] });

      const score = await scoreWithJev([keyword("Go")], { ...ratedAt(APPLIED), noul: 0.05 }, resume);

      expect(score.results[0]).toMatchObject({ level: 0, weight: 0, matched: false });
      expect(score.results[0].evidence).toMatchObject({ explicit: false });
      expect(highlightedKeywords(score.results, { section: "experience", entry: 0 })).toEqual([]);
    });

    it("highlights a skill only in the Entries where Jev confirmed the sense", async () => {
      const resume = resumeWith({
        experience: [
          job("Jan 2022 - Present", ["Built Go microservices"], "Backend Engineer"),
          job("2018 - 2021", ["Led the go-to-market launch"], "Marketing Lead"),
        ],
        skills: [{ category: "Languages", items: "Go" }],
      });
      const answers = byEntry({ "Marketing Lead": { noul: 0.05 } }, ratedAt(APPLIED));

      const { results } = await scoreWithJev([keyword("Go")], answers, resume);

      const terms = (entry: Parameters<typeof highlightedKeywords>[1]) =>
        highlightedKeywords(results, entry).map((k) => k.term);
      expect(terms({ section: "experience", entry: 0 })).toEqual(["Go"]);
      expect(terms({ section: "experience", entry: 1 })).toEqual([]);
      expect(terms(null)).toEqual(["Go"]);
    });

    it("never highlights an Implied Skill", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", ["Ran services on EKS"])] });

      const { results } = await scoreWithJev([keyword("Kubernetes")], ratedAt(APPLIED), resume);

      expect(results[0].matched).toBe(true);
      expect(highlightedKeywords(results, { section: "experience", entry: 0 })).toEqual([]);
    });

    it("falls back to exact wording for every Keyword when any one Entry request fails", async () => {
      const resume = resumeWith({
        experience: [
          job("Jan 2022 - Present", ["Shipped Python services"], "Staff Engineer"),
          job("2018 - 2021", ["Ran services on EKS"], "Developer"),
        ],
      });
      const jev = fakeJev(byEntry({ Developer: { fail: true } }, ratedAt(APPLIED)));
      const keywords = [keyword("Python"), keyword("Kubernetes")];

      const quiet = console.error;
      console.error = () => {};
      const scoring = await scoreKeywords(keywords, resume, { apiKey: "test", fetch: jev.fetch }).finally(() => {
        console.error = quiet;
      });
      const score = scoreKeywordEvidence(keywords, scoring.evidence, resume, { now: NOW });

      expect(scoring.scoredBy).toBe("keyword");
      expect(score.results.map((r) => [r.level, r.weight])).toEqual([
        [MENTIONED, 1 / 3],
        [0, 0],
      ]);
    });
  });

  describe("Education and Skills Listings", () => {
    function school(bullets: string[], institution = "York University") {
      return { institution, location: "", degree: "BS", dates: "2018 - 2022", bullets };
    }

    it("rates a skill named as coursework in an Education Bullet at Familiarity, at Skills Listing weight", async () => {
      const resume = resumeWith({
        education: [school(["Built a React to-do app in a web development course"])],
      });
      const answers = byEntry({ "York University": { score: FAMILIARITY - 1 } }, ratedAt(APPLIED));

      const score = await scoreWithJev([keyword("React")], answers, resume);

      expect(score.results[0].level).toBe(FAMILIARITY);
      expect(score.results[0].weight).toBeCloseTo((0.4 * 2) / 3);
    });

    it.each([
      ["Professional Summary", { summary: "Led the go-to-market launch of a payments product" }],
      ["Education", { education: [school(["President of the go-to-market strategy club"])] }],
      ["Honors", { honors: [{ title: "Go-to-market Award", issuer: "Acme", date: "2024", description: "" }] }],
    ])("treats a literal match in the %s that fails its sense check as Absent", async (_, sections) => {
      const resume = resumeWith(sections);

      const score = await scoreWithJev([keyword("Go")], { ...ratedAt(APPLIED), noul: 0.05 }, resume);

      expect(score.results[0]).toMatchObject({ level: 0, weight: 0, matched: false });
      expect(score.results[0].evidence).toMatchObject({ explicit: false });
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
