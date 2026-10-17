/**
 * Presentation for the 1–4 rubric.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, tooltip, and summary use.
 */

export const RUBRIC_BAND_COUNT = 4;

const BAND_NAMES = ["Absent", "Listed", "Applied", "Core"] as const;

export type RubricBand = 1 | 2 | 3 | 4;
export type RubricBandName = (typeof BAND_NAMES)[number];

/** Applied and Core: used in context, not merely named. */
const HANDS_ON_BAND: RubricBand = 3;
/** Passive/Listed: named, without project or duty detail. */
const LISTED_BAND: RubricBand = 2;

export type KeywordCoverage = {
  handsOn: number;
  listed: number;
  total: number;
};

/** Nearest band. Jev may return a fraction; chips and the tooltip use the rounded step. */
export function rubricBand(level: number): RubricBand {
  if (!Number.isFinite(level)) return 1;
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= RUBRIC_BAND_COUNT) return 4;
  return rounded as RubricBand;
}

export function rubricBandName(level: number): RubricBandName {
  return BAND_NAMES[rubricBand(level) - 1];
}

export function countKeywordCoverage(levels: readonly number[]): KeywordCoverage {
  let handsOn = 0;
  let listed = 0;
  for (const level of levels) {
    const band = rubricBand(level);
    if (band >= HANDS_ON_BAND) handsOn += 1;
    else if (band === LISTED_BAND) listed += 1;
  }
  return { handsOn, listed, total: levels.length };
}

/** "Required - Applied (3/4)". Importance is the keyword's; the band is the score. */
export function keywordLevelHint(importance: "required" | "preferred", level: number): string {
  const importanceLabel = importance === "required" ? "Required" : "Preferred";
  const band = rubricBand(level);
  return `${importanceLabel} - ${BAND_NAMES[band - 1]} (${band}/${RUBRIC_BAND_COUNT})`;
}
