import type {
  JdKeyword,
  KeywordCategory,
  KeywordEvidence,
  OtherKeywordEvidence,
  PlacementEvidence,
  PlacementSource,
  ResumeContent,
  SkillEvidence,
} from "./schema";

export type CategoryScore = {
  matched: number;
  total: number;
};

/**
 * One keyword after scoring.
 * `level` is 0 (Absent) or the 1–3 Depth Level of the best Placement for a Hard or Soft Skill,
 * and the 0–1 Match Probability for an Other Keyword.
 * `weight` is the 0–1 credit (importance is applied later).
 * `matched` is true for Hard and Soft Skills with a Placement and for Other Keywords that earn credit.
 */
export type KeywordMatchResult = {
  keyword: JdKeyword;
  level: number;
  weight: number;
  matched: boolean;
  evidence: KeywordEvidence;
};

export type MatchLabel = "Strong match" | "Good match" | "Fair match";

export type ResumeScore = {
  score: number;
  label: MatchLabel;
  matched: number;
  total: number;
  categories: Record<KeywordCategory, CategoryScore>;
  results: KeywordMatchResult[];
};

export const KEYWORD_CATEGORIES: readonly KeywordCategory[] = ["hard", "soft", "other"];

export const CATEGORY_WEIGHTS: Record<KeywordCategory, number> = {
  hard: 0.7,
  soft: 0.1,
  other: 0.2,
};

export const IMPORTANCE_WEIGHTS: Record<JdKeyword["importance"], number> = {
  required: 2,
  preferred: 1,
};

export const STRONG_MATCH_THRESHOLD = 80;
export const GOOD_MATCH_THRESHOLD = 60;

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_WORD_CHARS = new RegExp("[^\\p{L}\\p{N}]+", "gu");

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+\+/g, "plusplus")
    .replace(/\+/g, " plus ")
    .replace(/([a-z])#/g, "$1sharp")
    .replace(NON_WORD_CHARS, " ")
    .trim();
}

export function resumeToSearchText(content: ResumeContent): string {
  const { header, summary, education, experience, projects, skills, honors } = content;
  const parts: string[] = [
    header.name,
    header.phone,
    header.email,
    header.linkedin,
    header.github,
    summary,
  ];

  for (const entry of education) {
    parts.push(entry.institution, entry.location, entry.degree, entry.dates, ...entry.bullets);
  }
  for (const entry of experience) {
    parts.push(entry.title, entry.company, entry.location, entry.dates, ...entry.bullets);
  }
  for (const entry of projects) {
    parts.push(entry.name, entry.technologies, entry.dates, ...entry.bullets);
  }
  for (const entry of skills) {
    parts.push(entry.category, entry.items);
  }
  for (const entry of honors) {
    parts.push(entry.title, entry.issuer, entry.date, entry.description);
  }

  return normalize(parts.filter(Boolean).join(" \n "));
}

const MIN_PLURAL_TOKEN_LENGTH = 3;

function lastTokenLength(normalized: string): number {
  return normalized.length - normalized.lastIndexOf(" ") - 1;
}

function termVariants(term: string): string[] {
  const normalized = normalize(term);
  if (!normalized) return [];

  const variants = [normalized];
  if (
    lastTokenLength(normalized) > MIN_PLURAL_TOKEN_LENGTH &&
    normalized.endsWith("s") &&
    !normalized.endsWith("ss")
  ) {
    variants.push(normalized.slice(0, -1));
  }
  return variants;
}

function containsVariant(haystack: string, variant: string): boolean {
  if (haystack.includes(` ${variant} `)) return true;
  if (lastTokenLength(variant) < MIN_PLURAL_TOKEN_LENGTH) return false;
  return haystack.includes(` ${variant}s `) || haystack.includes(` ${variant}es `);
}

/** `searchText` must come from `resumeToSearchText` (or `normalize`). */
export function isMatched(keyword: JdKeyword, searchText: string): boolean {
  const haystack = ` ${searchText} `;
  return [keyword.term, ...keyword.aliases].some((candidate) =>
    termVariants(candidate).some((variant) => containsVariant(haystack, variant)),
  );
}

export type TextSpan = { start: number; end: number };

const WORD_CHAR = /[\p{L}\p{N}]/u;

type MappedText = {
  text: string;
  /** Source offsets covered by each character of `text`. */
  start: number[];
  end: number[];
};

function pushMapped(
  chars: string[],
  starts: number[],
  ends: number[],
  chunk: string,
  start: number,
  end: number,
) {
  for (const ch of chunk) {
    chars.push(ch);
    starts.push(start);
    ends.push(end);
  }
}

/**
 * Same transforms as `normalize`, but each normalized character remembers the
 * source slice it came from so a match can be painted back onto the original text.
 */
function normalizeMapped(input: string): MappedText {
  const folded: string[] = [];
  const foldedStart: number[] = [];
  const foldedEnd: number[] = [];

  let offset = 0;
  for (const raw of input) {
    const next = offset + raw.length;
    const foldedChars = raw.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase();
    pushMapped(folded, foldedStart, foldedEnd, foldedChars, offset, next);
    offset = next;
  }

  const expanded: string[] = [];
  const expandedStart: number[] = [];
  const expandedEnd: number[] = [];
  for (let i = 0; i < folded.length; i++) {
    const ch = folded[i];
    const start = foldedStart[i];
    const end = foldedEnd[i];
    if (ch === "&") {
      pushMapped(expanded, expandedStart, expandedEnd, " and ", start, end);
    } else if (ch === "+" && folded[i + 1] === "+") {
      pushMapped(expanded, expandedStart, expandedEnd, "plusplus", start, foldedEnd[i + 1]);
      i += 1;
    } else if (ch === "+") {
      pushMapped(expanded, expandedStart, expandedEnd, " plus ", start, end);
    } else if (ch === "#" && i > 0 && /[a-z]/.test(folded[i - 1])) {
      pushMapped(expanded, expandedStart, expandedEnd, "sharp", start, end);
    } else {
      expanded.push(ch);
      expandedStart.push(start);
      expandedEnd.push(end);
    }
  }

  const collapsed: string[] = [];
  const collapsedStart: number[] = [];
  const collapsedEnd: number[] = [];
  for (let i = 0; i < expanded.length; i++) {
    if (WORD_CHAR.test(expanded[i])) {
      collapsed.push(expanded[i]);
      collapsedStart.push(expandedStart[i]);
      collapsedEnd.push(expandedEnd[i]);
      continue;
    }
    let j = i + 1;
    while (j < expanded.length && !WORD_CHAR.test(expanded[j])) j += 1;
    collapsed.push(" ");
    collapsedStart.push(expandedStart[i]);
    collapsedEnd.push(expandedEnd[j - 1]);
    i = j - 1;
  }

  let from = 0;
  let to = collapsed.length;
  while (from < to && collapsed[from] === " ") from += 1;
  while (to > from && collapsed[to - 1] === " ") to -= 1;

  return {
    text: collapsed.slice(from, to).join(""),
    start: collapsedStart.slice(from, to),
    end: collapsedEnd.slice(from, to),
  };
}

function matchForms(keyword: JdKeyword): string[] {
  const forms = new Set<string>();
  for (const candidate of [keyword.term, ...keyword.aliases]) {
    for (const variant of termVariants(candidate)) {
      forms.add(variant);
      if (lastTokenLength(variant) >= MIN_PLURAL_TOKEN_LENGTH) {
        forms.add(`${variant}s`);
        forms.add(`${variant}es`);
      }
    }
  }
  return Array.from(forms);
}

function mergeSpans(spans: TextSpan[]): TextSpan[] {
  const sorted = spans
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: TextSpan[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ start: span.start, end: span.end });
    }
  }
  return merged;
}

/**
 * Spans of `text` that the scorer would count for these keywords.
 * Uses the same term, alias, and plural rules as `isMatched`.
 */
export function findKeywordSpans(text: string, keywords: JdKeyword[]): TextSpan[] {
  if (!text || keywords.length === 0) return [];

  const mapped = normalizeMapped(text);
  if (!mapped.text) return [];

  const haystack = ` ${mapped.text} `;
  const spans: TextSpan[] = [];

  for (const form of keywords.flatMap(matchForms)) {
    const needle = ` ${form} `;
    let from = 0;
    while (from <= haystack.length) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      // The padded haystack has one leading space, so `at` is the form's start in `mapped.text`.
      const mappedStart = at;
      const mappedEnd = at + form.length;
      if (mappedEnd <= mapped.text.length) {
        spans.push({ start: mapped.start[mappedStart], end: mapped.end[mappedEnd - 1] });
      }
      // Keep the boundary space so the next token can still match ("sql sql").
      from = at + form.length;
    }
  }

  return mergeSpans(spans);
}

export function getMatchLabel(score: number): MatchLabel {
  if (score >= STRONG_MATCH_THRESHOLD) return "Strong match";
  if (score >= GOOD_MATCH_THRESHOLD) return "Good match";
  return "Fair match";
}

/**
 * Scoring is split so each piece can change independently (SRP):
 * - `isMatched` / `findKeywordSpans` — literal text for the highlighter.
 * - `explicitSkillEvidence` — the Placements that name a skill literally.
 * - `estimateKeywordEvidence` — fallback evidence (Explicit → Mentioned, literal Other → 1, else 0).
 * - `scoreKeywordEvidence` — best Placement by Depth Level, Recency, and Duration, plus
 *   Dual Placement, and Match Probability → credit for Other Keywords, from any source (DIP).
 */

/** Level reported for a Hard or Soft Skill with no Placement that counts. */
export const ABSENT_LEVEL = 0;
/** Depth Level `n` is `DEPTH_LEVEL_NAMES[n - 1]`. */
export const DEPTH_LEVEL_NAMES = [
  "Mentioned",
  "Familiarity",
  "Applied / Production",
] as const;
export const MENTIONED_LEVEL = 1;
const MIN_DEPTH_LEVEL = MENTIONED_LEVEL;
export const MAX_DEPTH_LEVEL = DEPTH_LEVEL_NAMES.length;
/** A Placement counts only when Jev's presence answer is at least this. */
export const PRESENCE_CUTOFF = 0.7;
/** Share of the named credit an Implied Hard Skill earns: applicant tracking systems search tools by name. */
export const IMPLIED_HARD_SKILL_MULTIPLIER = 0.5;
const SKILLS_LISTING_WEIGHT = 0.4;
const DUAL_PLACEMENT_BONUS = 0.1;

const CURRENT_ROLE_WEIGHT = 1;
const MIN_WORK_HISTORY_WEIGHT = 0.5;
const PROJECT_MAX_WEIGHT = 0.8;
const CURRENT_END = /^(present|current|now|ongoing|today)$/i;

function anyMatch(keyword: JdKeyword, texts: string[]): boolean {
  return isMatched(keyword, normalize(texts.filter(Boolean).join(" \n ")));
}

/** Every Entry, and the Skills Listing, that names the Keyword literally. */
export function findLiteralPlacements(keyword: JdKeyword, resume: ResumeContent): PlacementSource[] {
  const { summary, education, experience, projects, skills, honors } = resume;
  const sources: PlacementSource[] = [];
  experience.forEach((entry, index) => {
    if (anyMatch(keyword, [entry.title, ...entry.bullets])) {
      sources.push({ section: "experience", entry: index });
    }
  });
  projects.forEach((entry, index) => {
    if (anyMatch(keyword, [entry.name, entry.technologies, ...entry.bullets])) {
      sources.push({ section: "projects", entry: index });
    }
  });
  education.forEach((entry, index) => {
    if (anyMatch(keyword, [entry.degree, ...entry.bullets])) {
      sources.push({ section: "education", entry: index });
    }
  });
  if (anyMatch(keyword, [summary])) {
    sources.push({ section: "summary" });
  }
  if (anyMatch(keyword, skills.flatMap((entry) => [entry.category, entry.items]))) {
    sources.push({ section: "skills" });
  }
  if (anyMatch(keyword, honors.flatMap((entry) => [entry.title, entry.issuer, entry.description]))) {
    sources.push({ section: "honors" });
  }
  return sources;
}

export function isWorkHistory(source: PlacementSource): boolean {
  return source.section === "experience" || source.section === "projects";
}

export function isSamePlacementSource(a: PlacementSource, b: PlacementSource): boolean {
  if (a.section !== b.section) return false;
  return !("entry" in a) || !("entry" in b) || a.entry === b.entry;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const FULL_RECENCY = 1;
const RECENCY_DECAY_PER_YEAR = 0.1;

/** Months since year 0, so differences are plain subtraction. */
function toMonthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

/** "Oct 2023", "October 2023", "10/2023", or "2023" (read as `bareYearMonth`). */
function parseMonthIndex(text: string, bareYearMonth: number): number | null {
  const named = /^([a-z]+)\.?\s+(\d{4})$/i.exec(text);
  if (named) {
    const month = MONTHS.indexOf(named[1].slice(0, 3).toLowerCase());
    return month === -1 ? null : Number(named[2]) * 12 + month;
  }
  const numeric = /^(\d{1,2})\/(\d{4})$/.exec(text);
  if (numeric) {
    const month = Number(numeric[1]) - 1;
    return month < 0 || month > 11 ? null : Number(numeric[2]) * 12 + month;
  }
  const year = /^(\d{4})$/.exec(text);
  return year ? Number(year[1]) * 12 + bareYearMonth : null;
}

const SHORT_DURATION_FACTOR = 0.8;
const FULL_DURATION_START_YEARS = 1;
const FULL_DURATION_YEARS = 3;
/** "start - end", "start -- end", "start – end", "2019-2021", or "start to end". The end may be blank. */
const DATE_RANGE = /^(.*?)(?:\s*[–—−]\s*|\s+--?\s*|(?<=\d{4})-|\s+to\s+)(.*)$/i;

type DateRange = { startMonth: number; endMonth: number; isCurrent: boolean };

function parseDateRange(dates: string, now: Date): DateRange | null {
  const range = DATE_RANGE.exec(dates.trim());
  if (!range) return null;
  const startMonth = parseMonthIndex(range[1].trim(), 0);
  if (startMonth === null) return null;
  const endText = range[2].trim();
  if (endText === "" || CURRENT_END.test(endText)) {
    return { startMonth, endMonth: toMonthIndex(now), isCurrent: true };
  }
  const endMonth = parseMonthIndex(endText, 11);
  return endMonth === null ? null : { startMonth, endMonth, isCurrent: false };
}

function durationFactor(years: number): number {
  const progress =
    (years - FULL_DURATION_START_YEARS) / (FULL_DURATION_YEARS - FULL_DURATION_START_YEARS);
  return SHORT_DURATION_FACTOR + (1 - SHORT_DURATION_FACTOR) * Math.min(1, Math.max(0, progress));
}

/** Education is a Skills Listing, so its dates add no Recency or Duration. */
function placementWeight(source: PlacementSource, resume: ResumeContent, now: Date): number {
  switch (source.section) {
    case "experience":
      return Math.min(CURRENT_ROLE_WEIGHT, datedWeight(resume.experience[source.entry]?.dates ?? "", now));
    case "projects":
      return Math.min(PROJECT_MAX_WEIGHT, datedWeight(resume.projects[source.entry]?.dates ?? "", now));
    case "education":
    case "summary":
    case "skills":
    case "honors":
      return SKILLS_LISTING_WEIGHT;
  }
}

/** Unreadable dates get the minimum, so a Bullet always outweighs a Skills Listing. */
function datedWeight(dates: string, now: Date): number {
  const range = parseDateRange(dates, now);
  if (!range) return MIN_WORK_HISTORY_WEIGHT;
  const yearsSinceEnd = range.isCurrent
    ? 0
    : Math.max(0, toMonthIndex(now) - range.endMonth) / 12;
  const recency = FULL_RECENCY - RECENCY_DECAY_PER_YEAR * yearsSinceEnd;
  const years = Math.max(0, range.endMonth - range.startMonth) / 12;
  return Math.max(MIN_WORK_HISTORY_WEIGHT, recency * durationFactor(years));
}

function emptyCategoryScores(): Record<KeywordCategory, CategoryScore> {
  return {
    hard: { matched: 0, total: 0 },
    soft: { matched: 0, total: 0 },
    other: { matched: 0, total: 0 },
  };
}

function resolveCategory(category: JdKeyword["category"]): KeywordCategory {
  return KEYWORD_CATEGORIES.includes(category) ? category : "other";
}

/** An Explicit Skill is never below Mentioned, whatever level the pass reported. */
function clampDepthLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_DEPTH_LEVEL;
  return Math.min(MAX_DEPTH_LEVEL, Math.max(MIN_DEPTH_LEVEL, level));
}

/** Depth Level 1–3 → 1/3 / 2/3 / 1. Fractions are kept. */
export function depthLevelToWeight(level: number): number {
  return clampDepthLevel(level) / MAX_DEPTH_LEVEL;
}

/** Below this Match Probability Jev is guessing, so the Keyword earns nothing. */
export const MATCH_PROBABILITY_FLOOR = 0.5;
/** At or above this Match Probability the Keyword earns full credit. */
export const MATCH_PROBABILITY_FULL = 0.9;

/** Other Keywords earn credit by meaning, not by literal match or Placement. */
export function isSemanticKeyword(keyword: JdKeyword): boolean {
  return resolveCategory(keyword.category) === "other";
}

function clampProbability(probability: number): number {
  if (!Number.isFinite(probability)) return 0;
  return Math.min(1, Math.max(0, probability));
}

/** 0 below the floor, 1 at or above the full mark, linear in between. */
export function matchProbabilityToCredit(probability: number): number {
  const p = clampProbability(probability);
  if (p < MATCH_PROBABILITY_FLOOR) return 0;
  if (p >= MATCH_PROBABILITY_FULL) return 1;
  return (p - MATCH_PROBABILITY_FLOOR) / (MATCH_PROBABILITY_FULL - MATCH_PROBABILITY_FLOOR);
}

function toSemanticMatchResult(keyword: JdKeyword, evidence: OtherKeywordEvidence): KeywordMatchResult {
  const p = clampProbability(evidence.matchProbability);
  const weight = matchProbabilityToCredit(p);
  return { keyword, level: p, weight, matched: weight > 0, evidence };
}

function placementCredit(placement: PlacementEvidence, resume: ResumeContent, now: Date): number {
  return depthLevelToWeight(placement.depthLevel) * placementWeight(placement.source, resume, now);
}

function toSkillMatchResult(
  keyword: JdKeyword,
  evidence: SkillEvidence,
  resume: ResumeContent,
  now: Date,
): KeywordMatchResult {
  const placements = countingPlacements(evidence);
  if (placements.length === 0) {
    return { keyword, level: ABSENT_LEVEL, weight: 0, matched: false, evidence };
  }
  const credits = placements.map((placement) => placementCredit(placement, resume, now));
  const best = credits.indexOf(Math.max(...credits));
  const isDualPlacement =
    placements.some((placement) => isWorkHistory(placement.source)) &&
    placements.some((placement) => !isWorkHistory(placement.source));
  const named = Math.min(1, credits[best] + (isDualPlacement ? DUAL_PLACEMENT_BONUS : 0));
  return {
    keyword,
    level: clampDepthLevel(placements[best].depthLevel),
    weight: evidence.explicit ? named : named * impliedMultiplier(keyword),
    matched: true,
    evidence,
  };
}

/** Soft Skills are never Implied yet, so only Hard Skills are reduced. */
function impliedMultiplier(keyword: JdKeyword): number {
  return resolveCategory(keyword.category) === "hard" ? IMPLIED_HARD_SKILL_MULTIPLIER : 1;
}

/** The Placements that earn credit: those whose presence reaches `PRESENCE_CUTOFF`. */
export function countingPlacements(evidence: SkillEvidence): PlacementEvidence[] {
  return evidence.placements.filter((placement) => placement.presence >= PRESENCE_CUTOFF);
}

/** One Experience or Projects Entry, for text that sits inside it. */
export type WorkHistoryEntryRef = { section: "experience" | "projects"; entry: number };

/**
 * Keywords to highlight in one Work History Entry's text, or in text outside every Work History
 * Entry when `entry` is null. Implied Skills have no word to highlight, and a literal match in an
 * Entry where Jev rejected the sense is left unmarked.
 */
export function highlightedKeywords(
  results: KeywordMatchResult[],
  entry: WorkHistoryEntryRef | null,
): JdKeyword[] {
  return results
    .filter(({ matched, evidence }) => {
      if (!matched) return false;
      if (evidence.kind === "other") return true;
      if (!evidence.explicit) return false;
      return !(
        entry &&
        evidence.placements.some(
          (placement) => isSamePlacementSource(placement.source, entry) && placement.presence < PRESENCE_CUTOFF,
        )
      );
    })
    .map(({ keyword }) => keyword);
}

export function isExplicitSkill(keyword: JdKeyword, resume: ResumeContent): boolean {
  return findLiteralPlacements(keyword, resume).length > 0;
}

/** Every Placement that names the skill literally, each at `depthLevel`. */
export function explicitSkillEvidence(
  keyword: JdKeyword,
  resume: ResumeContent,
  depthLevel: number,
): SkillEvidence {
  const placements = findLiteralPlacements(keyword, resume).map((source) => ({
    source,
    presence: 1,
    depthLevel,
  }));
  return { kind: "skill", explicit: placements.length > 0, placements, demonstratingBullets: [] };
}

/**
 * Fallback when Jev is unavailable: every Explicit Skill is Mentioned at each literal Placement,
 * and an Other Keyword whose term or alias appears literally has Match Probability 1.
 * Everything else is 0. Placement, Recency, and Duration still apply in `scoreKeywordEvidence`.
 */
export function estimateKeywordEvidence(
  keywords: JdKeyword[],
  content: ResumeContent,
): KeywordEvidence[] {
  return keywords.map((keyword) => {
    if (!isSemanticKeyword(keyword)) return explicitSkillEvidence(keyword, content, MENTIONED_LEVEL);
    return { kind: "other", matchProbability: isExplicitSkill(keyword, content) ? 1 : 0 };
  });
}

export type ScoreKeywordEvidenceOptions = {
  /** Reference date for Recency and for "Present" end dates. */
  now?: Date;
};

/**
 * Weighted resume score from evidence aligned with `keywords` by index.
 * Hard and Soft Skills: among Placements with presence ≥ `PRESENCE_CUTOFF`, the best one's depth
 * weight × Placement weight, + Dual Placement bonus, capped at 1, then × `IMPLIED_HARD_SKILL_MULTIPLIER`
 * for an Implied Hard Skill. Other Keywords: `matchProbabilityToCredit` of the Match Probability.
 * Open for new scorers (Jev, fallback): pass evidence in, do not change this function.
 */
export function scoreKeywordEvidence(
  keywords: JdKeyword[],
  evidence: KeywordEvidence[],
  resume: ResumeContent,
  options: ScoreKeywordEvidenceOptions = {},
): ResumeScore {
  const now = options.now ?? new Date();
  if (keywords.length !== evidence.length) {
    throw new Error(
      `scoreKeywordEvidence: expected evidence for ${keywords.length} keywords, received ${evidence.length}`,
    );
  }

  const categories = emptyCategoryScores();
  const weighted = emptyCategoryScores();

  const results = keywords.map((keyword, index) => {
    const keywordEvidence = evidence[index];
    const result =
      keywordEvidence.kind === "other"
        ? toSemanticMatchResult(keyword, keywordEvidence)
        : toSkillMatchResult(keyword, keywordEvidence, resume, now);
    const importance = IMPORTANCE_WEIGHTS[keyword.importance] ?? IMPORTANCE_WEIGHTS.preferred;
    const bucket = resolveCategory(keyword.category);

    categories[bucket].total += 1;
    weighted[bucket].total += importance;
    weighted[bucket].matched += importance * result.weight;
    if (result.matched) {
      categories[bucket].matched += 1;
    }
    return result;
  });

  let weightSum = 0;
  let weightedRatio = 0;
  for (const category of KEYWORD_CATEGORIES) {
    const { matched, total } = weighted[category];
    if (total === 0) continue;
    weightSum += CATEGORY_WEIGHTS[category];
    weightedRatio += CATEGORY_WEIGHTS[category] * (matched / total);
  }

  const score = weightSum === 0 ? 0 : Math.round((weightedRatio / weightSum) * 100);
  const matched = results.filter((result) => result.matched).length;

  return {
    score,
    label: getMatchLabel(score),
    matched,
    total: results.length,
    categories,
    results,
  };
}

/** Jev-free convenience: fallback evidence through the shared aggregator. */
export function scoreResume(keywords: JdKeyword[], content: ResumeContent): ResumeScore {
  return scoreKeywordEvidence(keywords, estimateKeywordEvidence(keywords, content), content);
}
