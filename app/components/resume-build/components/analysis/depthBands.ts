import { ABSENT_LEVEL, DEPTH_LEVEL_NAMES, MAX_DEPTH_LEVEL } from "@/lib/resume/keywordMatch";

/**
 * Presentation for Depth Levels.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, tooltip, and summary use.
 */

/** Band 0 is Absent: an Implied Skill or a Keyword not on the resume. Bands 1–4 are Depth Levels. */
export type DepthBand = 0 | 1 | 2 | 3 | 4;

const BAND_NAMES = ["Absent", ...DEPTH_LEVEL_NAMES] as const;
export type DepthBandName = (typeof BAND_NAMES)[number];

export const DEPTH_BANDS: readonly DepthBand[] = [0, 1, 2, 3, 4];

/** Applied / Production and Advanced / Specialized: used in context, not merely named. */
const HANDS_ON_BAND: DepthBand = 3;
const FAMILIARITY_BAND: DepthBand = 2;
const MENTIONED_BAND: DepthBand = 1;

export type KeywordCoverage = {
  handsOn: number;
  familiar: number;
  mentioned: number;
  total: number;
};

/** Nearest band. Jev may return a fraction; chips and the tooltip use the rounded step. */
export function depthBand(level: number): DepthBand {
  if (!Number.isFinite(level)) return ABSENT_LEVEL;
  const rounded = Math.round(level);
  if (rounded <= ABSENT_LEVEL) return ABSENT_LEVEL;
  if (rounded >= MAX_DEPTH_LEVEL) return MAX_DEPTH_LEVEL as DepthBand;
  return rounded as DepthBand;
}

export function depthBandName(level: number): DepthBandName {
  return BAND_NAMES[depthBand(level)];
}

export function countKeywordCoverage(levels: readonly number[]): KeywordCoverage {
  let handsOn = 0;
  let familiar = 0;
  let mentioned = 0;
  for (const level of levels) {
    const band = depthBand(level);
    if (band >= HANDS_ON_BAND) handsOn += 1;
    else if (band === FAMILIARITY_BAND) familiar += 1;
    else if (band === MENTIONED_BAND) mentioned += 1;
  }
  return { handsOn, familiar, mentioned, total: levels.length };
}

/** "Required - Applied / Production (3/4)", or "Required - Absent" when the Keyword earns nothing. */
export function keywordLevelHint(importance: "required" | "preferred", level: number): string {
  const importanceLabel = importance === "required" ? "Required" : "Preferred";
  const band = depthBand(level);
  if (band === ABSENT_LEVEL) return `${importanceLabel} - ${BAND_NAMES[band]}`;
  return `${importanceLabel} - ${BAND_NAMES[band]} (${band}/${MAX_DEPTH_LEVEL})`;
}
