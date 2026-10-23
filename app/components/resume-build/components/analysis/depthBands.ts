import {
  ABSENT_LEVEL,
  countingPlacements,
  DEPTH_LEVEL_NAMES,
  isSemanticKeyword,
  matchProbabilityToCredit,
  MAX_DEPTH_LEVEL,
  type KeywordMatchResult,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword, PlacementSource, ResumeContent } from "@/lib/resume/schema";

/**
 * Presentation for Depth Levels and Match Probabilities.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, tooltip, and summary use.
 */

/** Band 0 is Absent: a skill with no Placement that counts. Bands 1–3 are Depth Levels. */
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
  /** An Implied Skill: shown in Work History but never named on the resume. */
  notNamed: boolean;
};

const NOT_NAMED = "not named";

/** "Staff Engineer, Acme" for a job, the project name for a project. */
function entryLabel(source: PlacementSource, resume: ResumeContent): string {
  if (source.section === "experience") {
    const job = resume.experience[source.entry];
    return job ? [job.title, job.company].filter(Boolean).join(", ") : "";
  }
  if (source.section === "projects") return resume.projects[source.entry]?.name ?? "";
  return "";
}

/** `resume` is the one the evidence was scored against, so Entry indexes line up. */
export function keywordChip({ keyword, level, matched, evidence }: KeywordMatchResult, resume: ResumeContent): KeywordChip {
  if (isSemanticKeyword(keyword)) {
    const name = matchBandName(level);
    return {
      band: MATCH_BAND_LOOK[name],
      srLabel: name,
      hint: keywordMatchHint(keyword.importance, level),
      notNamed: false,
    };
  }
  const band = depthBand(level);
  const name = BAND_NAMES[band];
  const srLabel = band === ABSENT_LEVEL ? name : `${name}, ${band} of ${MAX_DEPTH_LEVEL}`;
  const hint = keywordLevelHint(keyword.importance, level);
  if (!matched || evidence.kind !== "skill" || evidence.explicit) {
    return { band, srLabel, hint, notNamed: false };
  }
  const shownIn = countingPlacements(evidence)
    .map((placement) => entryLabel(placement.source, resume))
    .filter(Boolean);
  return {
    band,
    srLabel: `${srLabel}, ${NOT_NAMED}`,
    hint: `${hint}, ${NOT_NAMED}. Shown in: ${shownIn.join("; ")}`,
    notNamed: true,
  };
}
