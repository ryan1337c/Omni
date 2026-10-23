import { describe, expect, it } from "vitest";

import type { JdKeyword, SkillEvidence } from "@/lib/resume/schema";

import {
  countKeywordCoverage,
  depthBand,
  depthBandName,
  keywordChip,
  keywordLevelHint,
  keywordMatchHint,
  matchBandName,
} from "./depthBands";

function keyword(category: JdKeyword["category"]): JdKeyword {
  return { term: "Skill", aliases: [], category, importance: "required" };
}

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

describe("keywordChip", () => {
  it("uses the top look with no depth fraction for a shown Other Keyword", () => {
    const evidence = { kind: "other", matchProbability: 0.95 } as const;
    expect(keywordChip({ keyword: keyword("other"), level: 0.95, weight: 1, matched: true, evidence })).toEqual({
      band: 3,
      srLabel: "Shown",
      hint: "Required - Shown (95%)",
    });
  });

  it("reads a Hard Skill's level as a Depth Level", () => {
    const evidence: SkillEvidence = {
      kind: "skill",
      explicit: true,
      placements: [{ source: { section: "skillsListing" }, presence: 1, depthLevel: 2 }],
      demonstratingBullets: [],
    };
    expect(keywordChip({ keyword: keyword("hard"), level: 2, weight: 0.5, matched: true, evidence })).toEqual({
      band: 2,
      srLabel: "Familiarity, 2 of 3",
      hint: "Required - Familiarity (2/3)",
    });
  });
});
