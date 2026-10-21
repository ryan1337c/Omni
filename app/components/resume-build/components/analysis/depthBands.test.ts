import { describe, expect, it } from "vitest";

import { countKeywordCoverage, depthBand, depthBandName, keywordLevelHint } from "./depthBands";

describe("depthBand", () => {
  it.each([
    [0, "Absent"],
    [1, "Mentioned"],
    [2, "Familiarity"],
    [3, "Applied / Production"],
    [4, "Advanced / Specialized"],
  ])("names level %d as %s", (level, name) => {
    expect(depthBandName(level)).toBe(name);
  });

  it("rounds a fractional Jev level to the nearest band", () => {
    expect(depthBand(3.99)).toBe(4);
    expect(depthBand(1.31)).toBe(1);
  });

  it("treats out-of-range or invalid levels as the nearest end of the scale", () => {
    expect(depthBand(-1)).toBe(0);
    expect(depthBand(9)).toBe(4);
    expect(depthBand(Number.NaN)).toBe(0);
  });
});

describe("countKeywordCoverage", () => {
  it("splits keywords into hands-on, familiarity, and mentioned, leaving Absent out", () => {
    expect(countKeywordCoverage([0, 1, 1, 2, 3, 4])).toEqual({
      handsOn: 2,
      familiar: 1,
      mentioned: 2,
      total: 6,
    });
  });
});

describe("keywordLevelHint", () => {
  it("shows the Depth Level out of four", () => {
    expect(keywordLevelHint("required", 3)).toBe("Required - Applied / Production (3/4)");
  });

  it("shows Absent without a fraction", () => {
    expect(keywordLevelHint("preferred", 0)).toBe("Preferred - Absent");
  });
});
