import type { JdKeyword, KeywordCategory, ResumeContent } from "./schema";

export type CategoryScore = {
  matched: number;
  total: number;
};

/**
 * One keyword after rubric scoring.
 * `weight` is the 0–1 credit for that level (importance is applied later).
 * `matched` is true at level 2+ (listed or better), including implicit Jev hits.
 */
export type KeywordMatchResult = {
  keyword: JdKeyword;
  level: number;
  weight: number;
  matched: boolean;
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
  hard: 0.6,
  soft: 0.2,
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
  const { header, education, experience, projects, skills } = content;
  const parts: string[] = [
    header.name,
    header.phone,
    header.email,
    header.linkedin,
    header.github,
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
 * - `estimateKeywordLevels` — string-match fallback (listed → 2, absent → 1).
 * - `scoreKeywordLevels` — pure aggregation over levels from any source (DIP).
 */

const RUBRIC_MIN_LEVEL = 1;
const RUBRIC_MAX_LEVEL = 4;
/** Four rubric steps → three intervals, so levels map to 0 / ~33 / ~66 / 100%. */
const LEVEL_WEIGHT_SPAN = RUBRIC_MAX_LEVEL - RUBRIC_MIN_LEVEL;
const MATCHED_LEVEL_THRESHOLD = 2;
const FALLBACK_ABSENT_LEVEL = 1;
const FALLBACK_LISTED_LEVEL = 2;

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

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return RUBRIC_MIN_LEVEL;
  return Math.min(RUBRIC_MAX_LEVEL, Math.max(RUBRIC_MIN_LEVEL, level));
}

/** Maps a 1–4 rubric level onto credit: 0, 1/3, 2/3, or 1. Fractions are kept. */
export function levelToWeight(level: number): number {
  return (clampLevel(level) - RUBRIC_MIN_LEVEL) / LEVEL_WEIGHT_SPAN;
}

/** Level 2+ (listed / applied / core) counts as present, including implicit Jev hits. */
export function isLevelMatched(level: number): boolean {
  return Math.round(clampLevel(level)) >= MATCHED_LEVEL_THRESHOLD;
}

function toKeywordMatchResult(keyword: JdKeyword, level: number): KeywordMatchResult {
  const clamped = clampLevel(level);
  return {
    keyword,
    level: clamped,
    weight: levelToWeight(clamped),
    matched: isLevelMatched(clamped),
  };
}

/**
 * String-match fallback when Jev is unavailable.
 * A literal hit is treated as listed (level 2), never applied/core — those need context.
 */
export function estimateKeywordLevels(
  keywords: JdKeyword[],
  content: ResumeContent,
): number[] {
  const searchText = resumeToSearchText(content);
  return keywords.map((keyword) =>
    isMatched(keyword, searchText) ? FALLBACK_LISTED_LEVEL : FALLBACK_ABSENT_LEVEL,
  );
}

/**
 * Weighted resume score from rubric levels aligned with `keywords` by index.
 * Open for new scorers (Jev, fallback, tests): pass levels in, do not change this function.
 */
export function scoreKeywordLevels(keywords: JdKeyword[], levels: number[]): ResumeScore {
  if (keywords.length !== levels.length) {
    throw new Error(
      `scoreKeywordLevels: expected ${keywords.length} levels, received ${levels.length}`,
    );
  }

  const categories = emptyCategoryScores();
  const weighted = emptyCategoryScores();

  const results = keywords.map((keyword, index) => {
    const result = toKeywordMatchResult(keyword, levels[index]);
    const importance = IMPORTANCE_WEIGHTS[keyword.importance] ?? IMPORTANCE_WEIGHTS.preferred;
    const bucket = resolveCategory(keyword.category);

    categories[bucket].total += 1;
    weighted[bucket].total += importance;
    // Partial credit: listed (33%) no longer scores the same as production use (100%).
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

/** String-match convenience: compose fallback levels with the shared aggregator. */
export function scoreResume(keywords: JdKeyword[], content: ResumeContent): ResumeScore {
  return scoreKeywordLevels(keywords, estimateKeywordLevels(keywords, content));
}
