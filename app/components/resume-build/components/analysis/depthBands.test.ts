import { describe, expect, it } from "vitest";

import { parseResumeContent } from "@/lib/resume/parseResumeJson";
import type { JdKeyword, SkillEvidence } from "@/lib/resume/schema";

import {
  countKeywordCoverage,
  depthBand,
  depthBandName,
  depthLevelGuide,
  keywordChip,
  keywordLevelHint,
  KEYWORD_GUIDE,
  keywordMatchHint,
  matchBandName,
  NOT_NAMED_GUIDE,
} from "./depthBands";

function keyword(category: JdKeyword["category"]): JdKeyword {
  return { term: "Skill", aliases: [], category, importance: "required" };
}

const resume = parseResumeContent({
  header: { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" },
  experience: [
    { title: "Staff Engineer", company: "Acme", location: "", dates: "2022 - Present", bullets: [] },
    { title: "Developer", company: "Initech", location: "", dates: "2018 - 2021", bullets: [] },
  ],
  projects: [{ name: "Tracker", technologies: "", dates: "", bullets: [] }],
});

describe("depthBand", () => {
  it.each([
    [0, "Absent"],
    [1, "Mentioned"],
    [2, "Familiarity"],
    [3, "Applied / Production"],
  ])("names level %d as %s", (level, name) => {
    expect(depthBandName(level)).toBe(name);
  });

  it("rounds a fractional Jev level to the nearest band", () => {
    expect(depthBand(2.6)).toBe(3);
    expect(depthBand(1.31)).toBe(1);
  });

  it("treats out-of-range or invalid levels as the nearest end of the scale", () => {
    expect(depthBand(-1)).toBe(0);
    expect(depthBand(9)).toBe(3);
    expect(depthBand(Number.NaN)).toBe(0);
  });
});

describe("countKeywordCoverage", () => {
  it("splits keywords into hands-on, familiarity, and mentioned, leaving Absent out", () => {
    expect(countKeywordCoverage([0, 1, 1, 2, 3, 3])).toEqual({
      handsOn: 2,
      familiar: 1,
      mentioned: 2,
      total: 6,
    });
  });
});

describe("keywordLevelHint", () => {
  it("shows the Depth Level out of three", () => {
    expect(keywordLevelHint("required", 3)).toBe("Required - Applied / Production (3/3)");
  });

  it("shows Absent without a fraction", () => {
    expect(keywordLevelHint("preferred", 0)).toBe("Preferred - Absent");
  });
});

describe("matchBandName", () => {
  it.each([
    [0.3, "Not shown"],
    [0.7, "Partly shown"],
    [0.9, "Shown"],
  ])("names Match Probability %d as %s", (probability, name) => {
    expect(matchBandName(probability)).toBe(name);
  });
});

describe("keywordMatchHint", () => {
  it("shows the Match Probability as a percentage", () => {
    expect(keywordMatchHint("required", 0.94)).toBe("Required - Shown (94%)");
  });
});

describe("guide text", () => {
  const CHIP_STATES: Record<JdKeyword["category"], string[]> = {
    hard: ["Absent", "Mentioned", "Familiarity", "Applied / Production"],
    soft: ["Absent", "Mentioned", "Applied / Production"],
    other: ["Not shown", "Partly shown", "Shown"],
  };

  it.each(Object.entries(CHIP_STATES))("gives every %s chip state, and only those, a meaning line and a tip", (category, states) => {
    const group = KEYWORD_GUIDE.find((candidate) => candidate.category === category);
    expect(group?.states.map((state) => state.name)).toEqual(states);
    for (const state of group?.states ?? []) {
      expect(state.meaning.trim(), `${category} ${state.name} meaning`).not.toBe("");
      expect(state.tip.trim(), `${category} ${state.name} tip`).not.toBe("");
    }
  });

  it("explains the not named marker once, with a tip naming the skill for Hard Skills and an optional one for Soft Skills", () => {
    expect(NOT_NAMED_GUIDE.meaning.trim()).not.toBe("");
    expect(NOT_NAMED_GUIDE.hardTip("Kubernetes")).toBe('Add "Kubernetes" to that Bullet.');
    expect(NOT_NAMED_GUIDE.softTip("Leadership")).toMatch(/^Optional:.*"Leadership"/);
  });
});

describe("depthLevelGuide", () => {
  it("lists Hard Skills, Soft Skills, and Other Keywords in order, each state with its sample chip look, meaning, and tip", () => {
    const guide = depthLevelGuide();

    expect(guide.groups.map((group) => [group.title, group.states.map((state) => [state.name, state.band])])).toEqual([
      ["Hard Skills", [["Absent", 0], ["Mentioned", 1], ["Familiarity", 2], ["Applied / Production", 3]]],
      ["Soft Skills", [["Absent", 0], ["Mentioned", 1], ["Applied / Production", 3]]],
      ["Other Keywords", [["Not shown", 0], ["Partly shown", 2], ["Shown", 3]]],
    ]);
    for (const state of guide.groups.flatMap((group) => group.states)) {
      expect(state.meaning.trim(), `${state.name} meaning`).not.toBe("");
      expect(state.tip.trim(), `${state.name} tip`).not.toBe("");
    }
  });

  it("uses the same text as the chip popover", () => {
    const guide = depthLevelGuide();
    const hard = guide.groups.find((group) => group.title === "Hard Skills");
    const chip = keywordChip(
      {
        keyword: keyword("hard"),
        level: 2,
        weight: 0.5,
        matched: true,
        evidence: { kind: "skill", explicit: true, placements: [{ source: { section: "skills" }, presence: 1, depthLevel: 2 }], demonstratingBullets: [] },
      },
      resume,
    );

    expect(hard?.states.find((state) => state.name === "Familiarity")?.meaning).toBe(chip.meaning);
  });

  it("explains the not named marker once, on a Depth Level chip, with a generic tip for Hard and an optional one for Soft Skills", () => {
    expect(depthLevelGuide().notNamed).toEqual({
      band: 3,
      meaning: NOT_NAMED_GUIDE.meaning,
      hardTip: "Add the skill's exact name to that Bullet.",
      softTip: expect.stringMatching(/^Optional:.*the trait's name/),
    });
  });
});

describe("keywordChip", () => {
  function guideMeaning(category: JdKeyword["category"], name: string): string | undefined {
    return KEYWORD_GUIDE.find((group) => group.category === category)?.states.find((state) => state.name === name)?.meaning;
  }

  function namedSkill(level: number): SkillEvidence {
    return {
      kind: "skill",
      explicit: true,
      placements: level > 0 ? [{ source: { section: "experience", entry: 0 }, presence: 1, depthLevel: level }] : [],
      demonstratingBullets: [],
    };
  }

  it("uses the top look with no depth fraction for a shown Other Keyword", () => {
    const evidence = { kind: "other", matchProbability: 0.95 } as const;
    expect(keywordChip({ keyword: keyword("other"), level: 0.95, weight: 1, matched: true, evidence }, resume)).toEqual({
      band: 3,
      srLabel: "Shown",
      hint: "Required - Shown (95%)",
      meaning: guideMeaning("other", "Shown"),
      notNamed: false,
      shownIn: [],
      tip: null,
    });
  });

  it.each([
    ["hard", 0, "Absent"],
    ["hard", 1, "Mentioned"],
    ["hard", 2, "Familiarity"],
    ["hard", 3, "Applied / Production"],
    ["soft", 0, "Absent"],
    ["soft", 1, "Mentioned"],
    ["soft", 3, "Applied / Production"],
  ] as const)("gives a named %s skill at level %d the %s meaning, with no tip or Entries", (category, level, name) => {
    const chip = keywordChip(
      { keyword: keyword(category), level, weight: 0, matched: level > 0, evidence: namedSkill(level) },
      resume,
    );
    expect(chip).toMatchObject({ meaning: guideMeaning(category, name), notNamed: false, shownIn: [], tip: null });
  });

  it.each([
    [0.3, "Not shown"],
    [0.7, "Partly shown"],
    [0.95, "Shown"],
  ])("gives an Other Keyword at Match Probability %d the %s meaning", (probability, name) => {
    const evidence = { kind: "other", matchProbability: probability } as const;
    const chip = keywordChip(
      { keyword: keyword("other"), level: probability, weight: 0, matched: name !== "Not shown", evidence },
      resume,
    );
    expect(chip).toMatchObject({ meaning: guideMeaning("other", name), notNamed: false, tip: null });
  });

  it("reads a Hard Skill's level as a Depth Level", () => {
    const evidence: SkillEvidence = {
      kind: "skill",
      explicit: true,
      placements: [{ source: { section: "skills" }, presence: 1, depthLevel: 2 }],
      demonstratingBullets: [],
    };
    expect(keywordChip({ keyword: keyword("hard"), level: 2, weight: 0.5, matched: true, evidence }, resume)).toEqual({
      band: 2,
      srLabel: "Familiarity, 2 of 3",
      hint: "Required - Familiarity (2/3)",
      meaning: guideMeaning("hard", "Familiarity"),
      notNamed: false,
      shownIn: [],
      tip: null,
    });
  });

  it("marks an Implied Hard Skill as not named, lists the Entries that showed it, and tips to add the term", () => {
    const evidence: SkillEvidence = {
      kind: "skill",
      explicit: false,
      placements: [
        { source: { section: "experience", entry: 0 }, presence: 0.9, depthLevel: 3 },
        { source: { section: "experience", entry: 1 }, presence: 0.2, depthLevel: 1 },
        { source: { section: "projects", entry: 0 }, presence: 0.8, depthLevel: 2 },
      ],
      demonstratingBullets: [],
    };

    expect(keywordChip({ keyword: keyword("hard"), level: 3, weight: 0.5, matched: true, evidence }, resume)).toEqual({
      band: 3,
      srLabel: "Applied / Production, 3 of 3, not named",
      hint: "Required - Applied / Production (3/3)",
      meaning: guideMeaning("hard", "Applied / Production"),
      notNamed: true,
      shownIn: ["Staff Engineer, Acme", "Tracker"],
      tip: 'Add "Skill" to that Bullet.',
    });
  });

  it("frames the tip for an Implied Soft Skill as optional", () => {
    const evidence: SkillEvidence = {
      kind: "skill",
      explicit: false,
      placements: [{ source: { section: "experience", entry: 1 }, presence: 0.85, depthLevel: 3 }],
      demonstratingBullets: [{ section: "experience", entry: 1, bullet: 0 }],
    };

    expect(keywordChip({ keyword: keyword("soft"), level: 3, weight: 0.8, matched: true, evidence }, resume)).toMatchObject({
      band: 3,
      notNamed: true,
      shownIn: ["Developer, Initech"],
      tip: expect.stringMatching(/^Optional:.*"Skill"/),
    });
  });
});
