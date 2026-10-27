import { describe, expect, it } from "vitest";

import { byEntry, scoreWithJev, withQuietConsole, type FakeJevAnswers } from "./fakeJev";
import { resumeHighlights } from "./highlights";
import { highlightedKeywords } from "./keywordMatch";
import { parseResumeContent } from "./parseResumeJson";
import type { JdKeyword, ResumeContent } from "./schema";

const MENTIONED = 1;
const FAMILIARITY = 2;
const APPLIED = 3;

function keyword(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "hard", importance: "required", alternatives: "", clause: "" };
}

function soft(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "soft", importance: "required", alternatives: "", clause: "" };
}

function other(term: string, aliases: string[] = []): JdKeyword {
  return { term, aliases, category: "other", importance: "required", alternatives: "", clause: "" };
}

/** Hard Skills that are Alternatives of one another. */
function anyOf(...terms: string[]): JdKeyword[] {
  return terms.map((term) => ({ ...keyword(term), alternatives: "set-1" }));
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

async function creditFor(term: JdKeyword, answers: FakeJevAnswers, resume: ResumeContent) {
  return (await scoreWithJev([term], answers, resume)).results[0].credit;
}

describe("Keyword credit", () => {
  it("gives an Implied Hard Skill at Applied / Production in a Current Role half the named credit", async () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", ["Deployed services on ECS and Lambda"])],
    });

    const score = await scoreWithJev([keyword("AWS")], ratedAt(APPLIED), resume);

    expect(score.results[0].credit).toBeCloseTo(0.5);
    expect(score.results[0].level).toBe(APPLIED);
    expect(score.results[0].matched).toBe(true);
    expect(score.results[0].evidence).toMatchObject({ explicit: false });
  });

  it("trusts a Technical Skills match without asking Jev, as a Skills Listing at Mentioned", async () => {
    const resume = resumeWith({ skills: [{ category: "Languages", items: "Python, Go" }] });

    const score = await scoreWithJev([keyword("Go")], { ...ratedAt(APPLIED), noul: 0.05 }, resume);

    expect(score.requests).toHaveLength(0);
    expect(score.results[0].level).toBe(MENTIONED);
    expect(score.results[0].credit).toBeCloseTo(0.4 / 3);
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

    expect(notShown.results[0].credit).toBe(0);
    expect(shownUnnamed.results[0].evidence).toMatchObject({ explicit: false });
    expect(shownUnnamed.results[0].credit).toBeCloseTo(0.5);
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
      expect(score.results[0].credit).toBeCloseTo(2 / 3 + 0.1);
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
      expect(score.results[0].credit).toBeCloseTo(0.5);
    });

    it("does not count a Placement whose presence is below 0.7", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", ["Ran services on EKS"])] });

      expect(await creditFor(keyword("Kubernetes"), { ...ratedAt(APPLIED), noul: 0.69 }, resume)).toBe(0);
      expect(await creditFor(keyword("Kubernetes"), { ...ratedAt(APPLIED), noul: 0.7 }, resume)).toBeCloseTo(0.5);
    });

    it("treats a literal match whose sense Jev rejects as Absent", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", ["Led the go-to-market launch"])] });

      const score = await scoreWithJev([keyword("Go")], { ...ratedAt(APPLIED), noul: 0.05 }, resume);

      expect(score.results[0]).toMatchObject({ level: 0, credit: 0, matched: false });
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
      const answers = byEntry({ Developer: { fail: true } }, ratedAt(APPLIED));
      const keywords = [keyword("Python"), keyword("Kubernetes")];

      const score = await withQuietConsole(() => scoreWithJev(keywords, answers, resume));

      expect(score.scoredBy).toBe("keyword");
      expect(score.results.map((r) => [r.level, r.credit])).toEqual([
        [MENTIONED, 1 / 3],
        [0, 0],
      ]);
    });
  });

  describe("Soft Skills judged per Bullet", () => {
    const LED_MIGRATION = "Led 4 engineers through a Postgres migration";
    const BUILT_API = "Built a REST API in Go";

    it("gives an Implied Soft Skill shown by a Bullet in a Current Role 0.8 of the named credit", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", [BUILT_API, LED_MIGRATION])] });

      const score = await scoreWithJev([soft("Leadership")], { bullets: { [BUILT_API]: 0.1, [LED_MIGRATION]: 0.9 } }, resume);

      expect(score.results[0]).toMatchObject({ level: APPLIED, matched: true });
      expect(score.results[0].credit).toBeCloseTo(0.8);
      expect(score.results[0].evidence).toMatchObject({ explicit: false });
    });

    it("rates a self-description Mentioned, never Familiarity", async () => {
      const claimInSummary = resumeWith({
        summary: "Strong communicator and team player.",
        experience: [job("Jan 2022 - Present", [BUILT_API])],
      });
      const claimInBullet = resumeWith({
        experience: [job("Jan 2022 - Present", ["Strong communicator who shipped Python services"])],
      });
      const communication = soft("Communication", ["communicator"]);
      const notAnExample = { bullets: { [BUILT_API]: 0.1, "Strong communicator who shipped Python services": 0.2 } };

      const fromSummary = await scoreWithJev([communication], { ...ratedAt(FAMILIARITY), ...notAnExample }, claimInSummary);
      const fromBullet = await scoreWithJev([communication], { ...ratedAt(FAMILIARITY), ...notAnExample }, claimInBullet);

      expect(fromSummary.results[0]).toMatchObject({ level: MENTIONED, matched: true });
      expect(fromSummary.results[0].credit).toBeCloseTo(0.4 / 3);
      expect(fromBullet.results[0]).toMatchObject({ level: MENTIONED, matched: true });
      expect(fromBullet.results[0].credit).toBeCloseTo(1 / 3);
    });

    it("rates a named Soft Skill with a demonstrating Bullet Applied / Production, in full", async () => {
      const resume = resumeWith({
        summary: "Engineering leadership across platform teams.",
        experience: [job("Jan 2022 - Present", [BUILT_API, LED_MIGRATION])],
      });

      const score = await scoreWithJev([soft("Leadership")], { bullets: { [BUILT_API]: 0.1, [LED_MIGRATION]: 0.9 } }, resume);

      expect(score.results[0]).toMatchObject({ level: APPLIED, credit: 1 });
      expect(score.results[0].evidence).toMatchObject({ explicit: true });
    });

    it("does not count a Bullet whose answer is below 0.7, and is Absent when never named", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", [LED_MIGRATION])] });

      const score = await scoreWithJev([soft("Leadership")], { bullets: { [LED_MIGRATION]: 0.69 } }, resume);

      expect(score.results[0]).toMatchObject({ level: 0, credit: 0, matched: false });
    });

    it("highlights the demonstrating Bullet and no other", async () => {
      const resume = resumeWith({ experience: [job("Jan 2022 - Present", [BUILT_API, LED_MIGRATION])] });

      const { results } = await scoreWithJev([soft("Leadership")], { bullets: { [BUILT_API]: 0.1, [LED_MIGRATION]: 0.9 } }, resume);
      const highlights = resumeHighlights(results, resume, resume);

      expect(highlights.isDemonstratingBullet({ section: "experience", entry: 0, bullet: 1 })).toBe(true);
      expect(highlights.isDemonstratingBullet({ section: "experience", entry: 0, bullet: 0 })).toBe(false);
    });

    it.each([
      ["Professional Summary", { summary: "Communication Studies graduate moving into data analysis" }, { section: "summary" }],
      [
        "Education",
        { education: [{ institution: "York University", location: "", degree: "BA, Communication Studies", dates: "", bullets: [] }] },
        { section: "education", entry: 0 },
      ],
      [
        "Licenses, Certifications, and Awards",
        { honors: [{ title: "Communication Studies Dean's List", issuer: "York University", date: "2022", description: "" }] },
        { section: "honors" },
      ],
    ] as const)("treats a Soft Skill named in the %s that fails its sense check as Absent and unhighlighted", async (_, sections, source) => {
      const resume = resumeWith(sections);

      const { results } = await scoreWithJev([soft("Communication")], { noul: 0.05 }, resume);

      expect(results[0]).toMatchObject({ level: 0, credit: 0, matched: false });
      expect(results[0].evidence).toMatchObject({ explicit: false });
      expect(highlightedKeywords(results, source)).toEqual([]);
    });

    it("keeps a Soft Skill Implied when its only literal match fails its sense check", async () => {
      const NEGOTIATED = "Negotiated scope between design and sales to unblock a launch";
      const resume = resumeWith({
        summary: "Communication Studies graduate moving into product engineering",
        experience: [job("Jan 2022 - Present", [NEGOTIATED])],
      });
      const answers = byEntry({ "Software Engineer": { bullets: { [NEGOTIATED]: 0.9 } } }, { noul: 0.05 });

      const score = await scoreWithJev([soft("Communication")], answers, resume);

      expect(score.results[0]).toMatchObject({ level: APPLIED, matched: true });
      expect(score.results[0].evidence).toMatchObject({ explicit: false });
      expect(score.results[0].credit).toBeCloseTo(0.8);
    });

    it("weights the demonstrating Entry by Recency and Duration", async () => {
      const resume = resumeWith({
        experience: [
          job("Jan 2022 - Present", [BUILT_API], "Backend Engineer"),
          job("Jan 2018 - Oct 2023", [LED_MIGRATION], "Tech Lead"),
        ],
        skills: [{ category: "Strengths", items: "Leadership" }],
      });

      const score = await scoreWithJev([soft("Leadership")], { bullets: { [BUILT_API]: 0.1, [LED_MIGRATION]: 0.9 } }, resume);

      expect(score.results[0].level).toBe(APPLIED);
      expect(score.results[0].credit).toBeCloseTo(0.7 + 0.1);
    });
  });

  describe("highlights after Entries change, before Re-analyze", () => {
    const backend = job("Jan 2022 - Present", ["Built Go microservices", "Mentored 3 new hires through onboarding"], "Backend Engineer");
    const marketing = job("2018 - 2021", ["Led the go-to-market launch"], "Marketing Lead");
    const added = job("2016 - 2018", ["Wrote Go tooling"], "Intern");
    const scored = resumeWith({ experience: [backend, marketing], skills: [{ category: "Languages", items: "Go" }] });
    const answers = byEntry(
      { "Marketing Lead": { noul: 0.05 } },
      { ...ratedAt(APPLIED), bullets: { "Built Go microservices": 0.1, "Mentored 3 new hires through onboarding": 0.9 } },
    );

    async function highlightsIn(live: ResumeContent) {
      const { results } = await scoreWithJev([keyword("Go"), soft("Mentorship")], answers, scored);
      const highlights = resumeHighlights(results, scored, live);
      return {
        terms: (entry: number) => highlights.keywordsIn({ section: "experience", entry }).map((k) => k.term),
        demonstrates: (entry: number, bullet: number) =>
          highlights.isDemonstratingBullet({ section: "experience", entry, bullet }),
      };
    }

    it("follows each Entry when Entries are reordered", async () => {
      const live = { ...scored, experience: [marketing, backend] };

      const { terms, demonstrates } = await highlightsIn(live);

      expect(terms(0)).toEqual([]);
      expect(terms(1)).toEqual(["Go"]);
      expect(demonstrates(0, 0)).toBe(false);
      expect(demonstrates(1, 1)).toBe(true);
    });

    it("follows each Entry when one is added or removed before it", async () => {
      const withAdded = await highlightsIn({ ...scored, experience: [added, backend, marketing] });
      const withRemoved = await highlightsIn({ ...scored, experience: [marketing] });

      expect(withAdded.terms(1)).toEqual(["Go"]);
      expect(withAdded.terms(2)).toEqual([]);
      expect(withAdded.demonstrates(1, 1)).toBe(true);
      expect(withRemoved.terms(0)).toEqual([]);
      expect(withRemoved.demonstrates(0, 0)).toBe(false);
    });

    it("highlights no skill in an Entry that was not scored", async () => {
      const { terms, demonstrates } = await highlightsIn({ ...scored, experience: [added, backend, marketing] });

      expect(terms(0)).toEqual([]);
      expect(demonstrates(0, 0)).toBe(false);
    });

    it("follows Education Entries too, and highlights no skill in one that was not scored", async () => {
      const york = { institution: "York University", location: "", degree: "BS", dates: "2018 - 2022", bullets: ["Go coursework"] };
      const seneca = { institution: "Seneca College", location: "", degree: "Diploma", dates: "2016 - 2018", bullets: ["Go labs"] };
      const scoredSchool = resumeWith({ education: [york] });

      const { results } = await scoreWithJev([keyword("Go")], ratedAt(FAMILIARITY), scoredSchool);
      const highlights = resumeHighlights(results, scoredSchool, { ...scoredSchool, education: [seneca, york] });
      const terms = (entry: number) => highlights.keywordsIn({ section: "education", entry }).map((k) => k.term);

      expect(terms(0)).toEqual([]);
      expect(terms(1)).toEqual(["Go"]);
    });

    it("stops highlighting a demonstrating Bullet once its text is edited", async () => {
      const edited = { ...backend, bullets: ["Built Go microservices", "Mentored new hires"] };

      const { demonstrates } = await highlightsIn({ ...scored, experience: [edited, marketing] });

      expect(demonstrates(0, 1)).toBe(false);
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
      expect(score.results[0].credit).toBeCloseTo((0.4 * 2) / 3);
    });

    it.each([
      ["Professional Summary", { summary: "Led the go-to-market launch of a payments product" }],
      ["Education", { education: [school(["President of the go-to-market strategy club"])] }],
      ["Licenses, Certifications, and Awards", { honors: [{ title: "Go-to-market Award", issuer: "Acme", date: "2024", description: "" }] }],
    ])("treats a literal match in the %s that fails its sense check as Absent", async (_, sections) => {
      const resume = resumeWith(sections);

      const score = await scoreWithJev([keyword("Go")], { ...ratedAt(APPLIED), noul: 0.05 }, resume);

      expect(score.results[0]).toMatchObject({ level: 0, credit: 0, matched: false });
      expect(score.results[0].evidence).toMatchObject({ explicit: false });
    });

    it("highlights a match where its sense check passed or was skipped, and nowhere it failed", async () => {
      const resume = resumeWith({
        summary: "Led the go-to-market launch of a payments product",
        education: [school(["President of the go-to-market strategy club"])],
        honors: [{ title: "Go-to-market Award", issuer: "Acme", date: "2024", description: "" }],
        skills: [{ category: "Languages", items: "Go" }],
      });

      const { results } = await scoreWithJev([keyword("Go")], { noul: 0.05 }, resume);

      const terms = (source: Parameters<typeof highlightedKeywords>[1]) =>
        highlightedKeywords(results, source).map((k) => k.term);
      expect(results[0].matched).toBe(true);
      expect(terms({ section: "summary" })).toEqual([]);
      expect(terms({ section: "education", entry: 0 })).toEqual([]);
      expect(terms({ section: "honors" })).toEqual([]);
      expect(terms({ section: "skills" })).toEqual(["Go"]);
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

      expect(score.results[0].credit).toBe(1);
      expect(score.results[0].matched).toBe(true);
      expect(score.score).toBe(100);
    });

    it("gives no credit below a Match Probability of 0.5", async () => {
      const score = await scoreWithJev([other("MS in Computer Science")], matchProbability(0.45), degree);

      expect(score.results[0].credit).toBe(0);
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

describe("Match Score", () => {
  const requiredMentoring = soft("Mentoring", ["mentored"]);
  const preferredKubernetes: JdKeyword = { ...keyword("Kubernetes"), importance: "preferred" };
  const MENTORING_BULLET = "Mentored 4 engineers through their first on-call rotation";
  const KUBERNETES_BULLET = "Ran 40 services on Kubernetes with Helm";

  it("counts a Required Soft Skill for more than a Preferred Hard Skill", async () => {
    const mentors = resumeWith({ experience: [job("Jan 2022 - Present", [MENTORING_BULLET])] });
    const runsKubernetes = resumeWith({
      experience: [job("Jan 2022 - Present", [KUBERNETES_BULLET])],
    });

    const shownSoft = await scoreWithJev(
      [requiredMentoring, preferredKubernetes],
      { noul: 0, bullets: { [MENTORING_BULLET]: 0.95 } },
      mentors,
    );
    const shownHard = await scoreWithJev(
      [requiredMentoring, preferredKubernetes],
      { ...ratedAt(APPLIED), noul: 0.95, bullets: { [KUBERNETES_BULLET]: 0 } },
      runsKubernetes,
    );

    expect(shownSoft.score).toBe(55);
    expect(shownHard.score).toBe(45);
  });

  describe("Alternatives", () => {
    const REACT_NATIVE_BULLET = "Shipped a React Native app to 20k users";
    const mobile = resumeWith({ experience: [job("Jan 2022 - Present", [REACT_NATIVE_BULLET])] });
    const byNameOnly: FakeJevAnswers = { fail: true };

    it("score as their best option alone, at one Keyword Weight", async () => {
      const [alone, set] = await withQuietConsole(() =>
        Promise.all([
          scoreWithJev([keyword("React Native"), keyword("Kubernetes")], byNameOnly, mobile),
          scoreWithJev([...anyOf("Expo", "React Native"), keyword("Kubernetes")], byNameOnly, mobile),
        ]),
      );

      expect(alone.score).toBeGreaterThan(0);
      expect(set.score).toBe(alone.score);
      expect(set.matched).toBe(1);
      expect(set.total).toBe(2);
      expect(set.categories.hard).toEqual({ matched: 1, total: 2 });
    });
  });

  it("is 100 when every Keyword has full Credit, whatever its Keyword Category and Importance", async () => {
    const resume = resumeWith({
      experience: [job("Jan 2022 - Present", [MENTORING_BULLET, KUBERNETES_BULLET])],
    });

    const score = await scoreWithJev([requiredMentoring, preferredKubernetes], ratedAt(APPLIED), resume);

    expect(score.score).toBe(100);
  });
});
