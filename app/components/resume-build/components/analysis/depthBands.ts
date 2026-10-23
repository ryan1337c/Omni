import {
  ABSENT_LEVEL,
  countingPlacements,
  DEPTH_LEVEL_NAMES,
  isSemanticKeyword,
  matchProbabilityToCredit,
  MAX_DEPTH_LEVEL,
  resolveCategory,
  type KeywordMatchResult,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword, PlacementSource, ResumeContent } from "@/lib/resume/schema";

/**
 * Presentation for Depth Levels and Match Probabilities.
 * Credit and the "present" threshold stay in `keywordMatch` (SRP).
 * This module only names the rounded band the chips, popover, and summary use, and holds the user guide text.
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

/**
 * Plain-language guide for users, read by chip popovers and the legend.
 * Jev's Depth Level criteria live in `jevScore` and must not be reworded from here.
 */
export type GuideState = {
  name: DepthBandName | MatchBandName;
  /** Which chip look the state uses. */
  band: DepthBand;
  meaning: string;
  /** How to reach the next level. */
  tip: string;
};

export type GuideGroup = {
  category: JdKeyword["category"];
  title: string;
  states: readonly GuideState[];
};

const FULL_CREDIT_TIP = "Full credit. No change needed.";

export const KEYWORD_GUIDE: readonly GuideGroup[] = [
  {
    category: "hard",
    title: "Hard Skills",
    states: [
      {
        name: "Absent",
        band: ABSENT_LEVEL,
        meaning: "The resume doesn't show this skill.",
        tip: "If you've used it, add a Bullet that names it and says what you did with it.",
      },
      {
        name: "Mentioned",
        band: MENTIONED_BAND,
        meaning: "The skill is named, but nothing shows you using it.",
        tip: "Add a Bullet showing what you built with it and the result.",
      },
      {
        name: "Familiarity",
        band: FAMILIARITY_BAND,
        meaning: "Shows introductory use, such as coursework, a tutorial, or a small exercise.",
        tip: "Add a Bullet about using it in a real project or job, with what you owned and the outcome.",
      },
      {
        name: "Applied / Production",
        band: HANDS_ON_BAND,
        meaning: "Shows real use in a project or job, with responsibilities or results.",
        tip: "Full credit. Showing it in your Current Role keeps it weighted highest.",
      },
    ],
  },
  {
    category: "soft",
    title: "Soft Skills",
    states: [
      {
        name: "Absent",
        band: ABSENT_LEVEL,
        meaning: "The resume doesn't name or show this trait.",
        tip: "Add a Bullet that is a specific example of it, with who was involved and the result.",
      },
      {
        name: "Mentioned",
        band: MENTIONED_BAND,
        meaning: 'The trait is only named or claimed, as in "strong communicator".',
        tip: "Back the claim with a Bullet that shows it in action, with who was involved and the result.",
      },
      {
        name: "Applied / Production",
        band: HANDS_ON_BAND,
        meaning: "A Bullet is a specific example of this trait.",
        tip: FULL_CREDIT_TIP,
      },
    ],
  },
  {
    category: "other",
    title: "Other Keywords",
    states: [
      {
        name: "Not shown",
        band: MATCH_BAND_LOOK["Not shown"],
        meaning: "The resume doesn't show this requirement.",
        tip: "If you meet it, state it plainly, such as the degree name or your years of experience.",
      },
      {
        name: "Partly shown",
        band: MATCH_BAND_LOOK["Partly shown"],
        meaning: "The resume may meet this requirement, but it isn't clear.",
        tip: "State it directly, in words close to the job description's.",
      },
      {
        name: "Shown",
        band: MATCH_BAND_LOOK.Shown,
        meaning: "The resume clearly meets this requirement.",
        tip: FULL_CREDIT_TIP,
      },
    ],
  },
];

/** Without a term, tips name the skill generically, for the legend. */
export const NOT_NAMED_GUIDE = {
  meaning:
    "Your Work History shows this skill but the resume never names it, so it earns less credit: applicant tracking systems and recruiters search by name.",
  hardTip: (term?: string) => `Add ${term ? `"${term}"` : "the skill's exact name"} to that Bullet.`,
  softTip: (term?: string) =>
    `Optional: if it reads naturally, add ${term ? `"${term}"` : "the trait's name"} to that Bullet. The example already earns most of the credit.`,
};

export type DepthLevelGuide = {
  groups: readonly GuideGroup[];
  notNamed: {
    /** Sample chip look; any Depth Level can carry the marker. */
    band: DepthBand;
    meaning: string;
    hardTip: string;
    softTip: string;
  };
};

/** The legend's full guide: every chip state, plus one entry for the "not named" marker. */
export function depthLevelGuide(): DepthLevelGuide {
  return {
    groups: KEYWORD_GUIDE,
    notNamed: {
      band: HANDS_ON_BAND,
      meaning: NOT_NAMED_GUIDE.meaning,
      hardTip: NOT_NAMED_GUIDE.hardTip(),
      softTip: NOT_NAMED_GUIDE.softTip(),
    },
  };
}

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
  /** Importance and state, e.g. "Required - Familiarity (2/3)". */
  hint: string;
  /** The state's one-line meaning from `KEYWORD_GUIDE`. */
  meaning: string;
  /** An Implied Skill: shown in Work History but never named on the resume. */
  notNamed: boolean;
  /** Entries that showed an Implied Skill, e.g. "Staff Engineer, Acme". Empty otherwise. */
  shownIn: string[];
  /** How to name an Implied Skill; null for every other chip. */
  tip: string | null;
};

const NOT_NAMED = "not named";

/** A Hard or Soft Skill's chip band. Soft Skills skip Familiarity, so a rounded 2 shows as Mentioned. */
function skillBand(keyword: JdKeyword, level: number): DepthBand {
  const band = depthBand(level);
  return resolveCategory(keyword.category) === "soft" && band === FAMILIARITY_BAND ? MENTIONED_BAND : band;
}

/** Shown in Work History but never named on the resume in that sense. */
function isImplied({ matched, evidence }: KeywordMatchResult): boolean {
  return matched && evidence.kind === "skill" && !evidence.explicit;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** "3 of 12 skills show hands-on use, 1 shows familiarity, 4 are only mentioned. 2 are shown but not named." */
function skillSentence(skills: KeywordMatchResult[]): string {
  const bands = skills.map(({ keyword, level }) => skillBand(keyword, level));
  const handsOn = bands.filter((band) => band === HANDS_ON_BAND).length;
  const familiar = bands.filter((band) => band === FAMILIARITY_BAND).length;
  const mentioned = bands.filter((band) => band === MENTIONED_BAND).length;
  const implied = skills.filter(isImplied).length;
  const hasHardSkill = skills.some(({ keyword }) => resolveCategory(keyword.category) === "hard");
  const clauses = [
    `${handsOn} of ${skills.length} ${plural(skills.length, "skill", "skills")} ${plural(handsOn, "shows", "show")} hands-on use`,
    hasHardSkill ? `${familiar} ${plural(familiar, "shows", "show")} familiarity` : "",
    `${mentioned} ${plural(mentioned, "is", "are")} only mentioned`,
  ];
  const coverage = `${clauses.filter(Boolean).join(", ")}.`;
  if (implied === 0) return coverage;
  return `${coverage} ${implied} ${plural(implied, "is", "are")} shown but ${NOT_NAMED}.`;
}

/** "2 of 3 other requirements shown." Counts any credit, like the Other group's count. */
function otherSentence(others: KeywordMatchResult[]): string {
  const shown = others.filter((result) => result.matched).length;
  return `${shown} of ${others.length} other ${plural(others.length, "requirement", "requirements")} shown.`;
}

/** The analysis panel's one-line summary of every Keyword. */
export function coverageSummary(results: KeywordMatchResult[]): string {
  const others = results.filter(({ keyword }) => isSemanticKeyword(keyword));
  const skills = results.filter(({ keyword }) => !isSemanticKeyword(keyword));
  return [skills.length > 0 ? skillSentence(skills) : "", others.length > 0 ? otherSentence(others) : ""]
    .filter(Boolean)
    .join(" ");
}

function guideMeaning(category: JdKeyword["category"], name: GuideState["name"]): string {
  const group = KEYWORD_GUIDE.find((candidate) => candidate.category === category);
  return group?.states.find((state) => state.name === name)?.meaning ?? "";
}

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
export function keywordChip(result: KeywordMatchResult, resume: ResumeContent): KeywordChip {
  const { keyword, level, evidence } = result;
  if (isSemanticKeyword(keyword)) {
    const name = matchBandName(level);
    return {
      band: MATCH_BAND_LOOK[name],
      srLabel: name,
      hint: keywordMatchHint(keyword.importance, level),
      meaning: guideMeaning("other", name),
      notNamed: false,
      shownIn: [],
      tip: null,
    };
  }
  const isSoft = resolveCategory(keyword.category) === "soft";
  const band = skillBand(keyword, level);
  const name = BAND_NAMES[band];
  const srLabel = band === ABSENT_LEVEL ? name : `${name}, ${band} of ${MAX_DEPTH_LEVEL}`;
  const hint = keywordLevelHint(keyword.importance, band);
  const meaning = guideMeaning(isSoft ? "soft" : "hard", name);
  if (!isImplied(result) || evidence.kind !== "skill") {
    return { band, srLabel, hint, meaning, notNamed: false, shownIn: [], tip: null };
  }
  const shownIn = countingPlacements(evidence)
    .map((placement) => entryLabel(placement.source, resume))
    .filter(Boolean);
  return {
    band,
    srLabel: `${srLabel}, ${NOT_NAMED}`,
    hint,
    meaning,
    notNamed: true,
    shownIn,
    tip: isSoft ? NOT_NAMED_GUIDE.softTip(keyword.term) : NOT_NAMED_GUIDE.hardTip(keyword.term),
  };
}
