import {
  ABSENT_LEVEL,
  DEPTH_LEVEL_NAMES,
  isSemanticKeyword,
  matchProbabilityToCredit,
  MAX_DEPTH_LEVEL,
  type KeywordMatchResult,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword } from "@/lib/resume/schema";

/**
 * Presentation for Depth Levels and Match Probabilities.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, tooltip, and summary use.
 */

/** Band 0 is Absent: an Implied Skill or a Keyword not on the resume. Bands 1–3 are Depth Levels. */
export type DepthBand = 0 | 1 | 2 | 3;

const BAND_NAMES = ["Absent", ...DEPTH_LEVEL_NAMES] as const;
export type DepthBandName = (typeof BAND_NAMES)[number];

export const DEPTH_BANDS: readonly DepthBand[] = [0, 1, 2, 3];

/** Applied / Production: used in context, not merely named. */
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

/** Hard and Soft Skill levels only; Other Keywords have no Depth Level. */
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

export type MatchBandName = "Not shown" | "Partly shown" | "Shown";

/** No credit, some credit, or full credit for a Match Probability. */
export function matchBandName(probability: number): MatchBandName {
  const credit = matchProbabilityToCredit(probability);
  if (credit <= 0) return "Not shown";
  if (credit >= 1) return "Shown";
  return "Partly shown";
}

/** Other chips reuse the Absent, Familiarity, and top depth looks. */
const MATCH_BAND_LOOK: Record<MatchBandName, DepthBand> = {
  "Not shown": ABSENT_LEVEL,
  "Partly shown": FAMILIARITY_BAND,
  Shown: HANDS_ON_BAND,
};

function importanceLabel(importance: JdKeyword["importance"]): string {
  return importance === "required" ? "Required" : "Preferred";
}

/** "Required - Applied / Production (3/3)", or "Required - Absent" when the Keyword earns nothing. */
export function keywordLevelHint(importance: JdKeyword["importance"], level: number): string {
  const band = depthBand(level);
  if (band === ABSENT_LEVEL) return `${importanceLabel(importance)} - ${BAND_NAMES[band]}`;
  return `${importanceLabel(importance)} - ${BAND_NAMES[band]} (${band}/${MAX_DEPTH_LEVEL})`;
}

/** "Required - Shown (94%)". */
export function keywordMatchHint(importance: JdKeyword["importance"], probability: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, probability)) * 100);
  return `${importanceLabel(importance)} - ${matchBandName(probability)} (${percent}%)`;
}

export type KeywordChip = {
  /** Which chip look to use. */
  band: DepthBand;
  /** Screen-reader text, e.g. "Familiarity, 2 of 3" or "Shown". */
  srLabel: string;
  hint: string;
};

export function keywordChip({ keyword, level }: KeywordMatchResult): KeywordChip {
  if (isSemanticKeyword(keyword)) {
    const name = matchBandName(level);
    return { band: MATCH_BAND_LOOK[name], srLabel: name, hint: keywordMatchHint(keyword.importance, level) };
  }
  const band = depthBand(level);
  const name = BAND_NAMES[band];
  return {
    band,
    srLabel: band === ABSENT_LEVEL ? name : `${name}, ${band} of ${MAX_DEPTH_LEVEL}`,
    hint: keywordLevelHint(keyword.importance, level),
  };
}
