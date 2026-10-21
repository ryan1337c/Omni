/**
 * Presentation for the Depth Level rubric.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, tooltip, and summary use.
 */

/** Depth Levels 1–4. Band 0 is Absent: an Implied Skill or a Keyword not on the resume. */
export const RUBRIC_BAND_COUNT = 4;

const BAND_NAMES = ["Absent", "Mentioned", "Familiarity", "Applied", "Advanced"] as const;

export type RubricBand = 0 | 1 | 2 | 3 | 4;
export type RubricBandName = (typeof BAND_NAMES)[number];

/** Applied and Advanced: used in context, not merely named. */
const HANDS_ON_BAND: RubricBand = 3;
const FAMILIARITY_BAND: RubricBand = 2;
const MENTIONED_BAND: RubricBand = 1;

export type KeywordCoverage = {
  handsOn: number;
  familiar: number;
  mentioned: number;
  total: number;
};

/** Nearest band. Jev may return a fraction; chips and the tooltip use the rounded step. */
export function rubricBand(level: number): RubricBand {
  if (!Number.isFinite(level)) return 0;
  const rounded = Math.round(level);
  if (rounded <= 0) return 0;
  if (rounded >= RUBRIC_BAND_COUNT) return 4;
  return rounded as RubricBand;
}

export function rubricBandName(level: number): RubricBandName {
  return BAND_NAMES[rubricBand(level)];
}

export function countKeywordCoverage(levels: readonly number[]): KeywordCoverage {
  let handsOn = 0;
  let familiar = 0;
  let mentioned = 0;
  for (const level of levels) {
    const band = rubricBand(level);
    if (band >= HANDS_ON_BAND) handsOn += 1;
    else if (band === FAMILIARITY_BAND) familiar += 1;
    else if (band === MENTIONED_BAND) mentioned += 1;
  }
  return { handsOn, familiar, mentioned, total: levels.length };
}

/** "Required - Applied (3/4)", or "Required - Absent" when the Keyword earns nothing. */
export function keywordLevelHint(importance: "required" | "preferred", level: number): string {
  const importanceLabel = importance === "required" ? "Required" : "Preferred";
  const band = rubricBand(level);
  if (band === 0) return `${importanceLabel} - ${BAND_NAMES[0]}`;
  return `${importanceLabel} - ${BAND_NAMES[band]} (${band}/${RUBRIC_BAND_COUNT})`;
}
