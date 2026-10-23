import { isSemanticKeyword } from "./keywordMatch";
import {
  DEFAULT_SECTION_ORDER,
  type BulletRef,
  type EducationEntry,
  type ExperienceEntry,
  type HonorEntry,
  type JdKeyword,
  type KeywordCategory,
  type KeywordEvidence,
  type KeywordScoring,
  type PlacementEntrySection,
  type PlacementEvidence,
  type PlacementSource,
  type ProjectEntry,
  type ResumeContent,
  type ResumeHeader,
  type SectionId,
  type SkillEntry,
  type TailoredResumeResponse,
  type WholeSectionPlacement,
} from "./schema";

// Caps so a huge or malformed model payload cannot explode later LaTeX/PDF work.
const MAX_HEADER_NAME = 120;
const MAX_HEADER_FIELD = 200;
const MAX_LINE_FIELD = 200;
const MAX_SUMMARY = 1200;
const MAX_SKILL_CATEGORY = 80;
const MAX_SKILL_ITEMS = 500;
const MAX_BULLET_OR_ALIAS = 400;
export const MAX_BULLETS_PER_ENTRY = 12;
const MAX_ALIASES_PER_KEYWORD = 8;
export const MAX_SECTION_ENTRIES = 20;
const MAX_KEYWORDS = 40;

const KEYWORD_CATEGORIES = new Set<KeywordCategory>(["hard", "soft", "other"]);
const KEYWORD_IMPORTANCE = new Set<JdKeyword["importance"]>([
  "required",
  "preferred",
]);

/** Thrown when the JSON is the wrong shape (not an object, invalid enum, etc.). */
export class InvalidResumeJsonError extends Error {
  readonly name = "InvalidResumeJsonError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidResumeJsonError(`Expected ${label} to be an object`);
  }
  return value as Record<string, unknown>;
}

// Non-strings become `fallback` (usually ""). Always trim; slice if over the cap.
function asString(value: unknown, maxLen: number, fallback = ""): string {
  const raw = typeof value === "string" ? value : fallback;
  const trimmed = raw.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

// Missing or non-array values become []. Callers never throw just because a list is absent.
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(
  value: unknown,
  maxItems: number,
  maxItemLen: number,
): string[] {
  return asArray(value)
    .map((item) => asString(item, maxItemLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function parseHeader(value: unknown): ResumeHeader {
  // Header is required. Missing keys become empty strings, not errors.
  const header = asObject(value, "header");
  return {
    name: asString(header.name, MAX_HEADER_NAME),
    phone: asString(header.phone, MAX_HEADER_FIELD),
    email: asString(header.email, MAX_HEADER_FIELD),
    linkedin: asString(header.linkedin, MAX_HEADER_FIELD),
    github: asString(header.github, MAX_HEADER_FIELD),
  };
}

function parseEducation(value: unknown): EducationEntry | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  return {
    institution: asString(entry.institution, MAX_LINE_FIELD),
    location: asString(entry.location, MAX_LINE_FIELD),
    degree: asString(entry.degree, MAX_LINE_FIELD),
    dates: asString(entry.dates, MAX_LINE_FIELD),
    bullets: asStringArray(
      entry.bullets,
      MAX_BULLETS_PER_ENTRY,
      MAX_BULLET_OR_ALIAS,
    ),
  };
}

function parseExperience(value: unknown): ExperienceEntry | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  return {
    title: asString(entry.title, MAX_LINE_FIELD),
    company: asString(entry.company, MAX_LINE_FIELD),
    location: asString(entry.location, MAX_LINE_FIELD),
    dates: asString(entry.dates, MAX_LINE_FIELD),
    bullets: asStringArray(
      entry.bullets,
      MAX_BULLETS_PER_ENTRY,
      MAX_BULLET_OR_ALIAS,
    ),
  };
}

function parseProject(value: unknown): ProjectEntry | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  return {
    name: asString(entry.name, MAX_LINE_FIELD),
    technologies: asString(entry.technologies, MAX_LINE_FIELD),
    dates: asString(entry.dates, MAX_LINE_FIELD),
    bullets: asStringArray(
      entry.bullets,
      MAX_BULLETS_PER_ENTRY,
      MAX_BULLET_OR_ALIAS,
    ),
  };
}

function parseSkill(value: unknown): SkillEntry | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  return {
    category: asString(entry.category, MAX_SKILL_CATEGORY),
    items: asString(entry.items, MAX_SKILL_ITEMS),
  };
}

function parseHonor(value: unknown): HonorEntry | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  return {
    title: asString(entry.title, MAX_LINE_FIELD),
    issuer: asString(entry.issuer, MAX_LINE_FIELD),
    date: asString(entry.date, MAX_LINE_FIELD),
    description: asString(entry.description, MAX_BULLET_OR_ALIAS),
  };
}

const SECTION_IDS = new Set<string>(DEFAULT_SECTION_ORDER);

/** Keep known ids in the given order, drop repeats, and append any missing ones in default order. */
export function normalizeSectionOrder(value: unknown): SectionId[] {
  const order: SectionId[] = [];
  for (const item of asArray(value)) {
    if (typeof item === "string" && SECTION_IDS.has(item) && !order.includes(item as SectionId)) {
      order.push(item as SectionId);
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }
  return order;
}

function parseKeyword(value: unknown): JdKeyword | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  const term = asString(entry.term, MAX_LINE_FIELD);
  // A keyword with no display term is useless; skip instead of inventing one.
  if (!term) {
    return null;
  }

  // Enums are strict: a wrong category/importance is a bad payload, not a skip.
  const category = entry.category;
  if (
    typeof category !== "string" ||
    !KEYWORD_CATEGORIES.has(category as KeywordCategory)
  ) {
    throw new InvalidResumeJsonError(
      `Expected keyword category to be "hard", "soft", or "other"`,
    );
  }

  const importance = entry.importance;
  if (
    typeof importance !== "string" ||
    !KEYWORD_IMPORTANCE.has(importance as JdKeyword["importance"])
  ) {
    throw new InvalidResumeJsonError(
      `Expected keyword importance to be "required" or "preferred"`,
    );
  }

  return {
    term,
    aliases: asStringArray(
      entry.aliases,
      MAX_ALIASES_PER_KEYWORD,
      MAX_BULLET_OR_ALIAS,
    ),
    category: category as KeywordCategory,
    importance: importance as JdKeyword["importance"],
  };
}

// Walk a section list, skip junk items, and cap how many entries we keep.
function mapEntries<T>(
  value: unknown,
  parse: (item: unknown) => T | null,
): T[] {
  const parsed: T[] = [];
  for (const item of asArray(value).slice(0, MAX_SECTION_ENTRIES)) {
    const entry = parse(item);
    if (entry) {
      parsed.push(entry);
    }
  }
  return parsed;
}

/**
 * Normalize untrusted resume JSON into `ResumeContent`.
 * Callers `JSON.parse` first; this only validates the already-parsed value.
 * Header must be an object. Section arrays may be missing (treated as []).
 * A missing `sectionOrder` (the model never sends one) becomes the default order.
 */
export function parseResumeContent(input: unknown): ResumeContent {
  const obj = asObject(input, "resume");
  return {
    header: parseHeader(obj.header),
    summary: asString(obj.summary, MAX_SUMMARY),
    education: mapEntries(obj.education, parseEducation),
    experience: mapEntries(obj.experience, parseExperience),
    projects: mapEntries(obj.projects, parseProject),
    skills: mapEntries(obj.skills, parseSkill),
    honors: mapEntries(obj.honors, parseHonor),
    sectionOrder: normalizeSectionOrder(obj.sectionOrder),
  };
}

/**
 * Normalize an untrusted keyword list on its own.
 * Split from the tailored-resume envelope so `/api/scoreResume` can validate
 * keywords without re-parsing a resume (single responsibility).
 * Missing or non-array input becomes []. Empty-term items are dropped.
 * A bad category or importance throws `InvalidResumeJsonError`.
 */
export function parseKeywords(value: unknown): JdKeyword[] {
  const keywords: JdKeyword[] = [];
  for (const item of asArray(value).slice(0, MAX_KEYWORDS)) {
    const keyword = parseKeyword(item);
    if (keyword) {
      keywords.push(keyword);
    }
  }
  return keywords;
}

const PLACEMENT_ENTRY_SECTIONS = new Set<PlacementEntrySection>(["experience", "projects", "education"]);
const WHOLE_SECTION_PLACEMENTS = new Set<WholeSectionPlacement>(["summary", "skills", "honors"]);
const BULLET_SECTIONS = new Set<BulletRef["section"]>(["experience", "projects"]);

function asFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidResumeJsonError(`Expected ${label} to be a number`);
  }
  return value;
}

function asIndex(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidResumeJsonError(`Expected ${label} to be an index`);
  }
  return value;
}

function parsePlacementSource(value: unknown): PlacementSource {
  const obj = asObject(value, "placement source");
  if (WHOLE_SECTION_PLACEMENTS.has(obj.section as WholeSectionPlacement)) {
    return { section: obj.section as WholeSectionPlacement };
  }
  if (!PLACEMENT_ENTRY_SECTIONS.has(obj.section as PlacementEntrySection)) {
    throw new InvalidResumeJsonError("Unknown placement section");
  }
  return { section: obj.section as PlacementEntrySection, entry: asIndex(obj.entry, "placement entry") };
}

function parsePlacement(value: unknown): PlacementEvidence {
  const obj = asObject(value, "placement");
  return {
    source: parsePlacementSource(obj.source),
    presence: asFiniteNumber(obj.presence, "presence"),
    depthLevel: asFiniteNumber(obj.depthLevel, "Depth Level"),
  };
}

function parseBulletRef(value: unknown): BulletRef {
  const obj = asObject(value, "bullet");
  if (!BULLET_SECTIONS.has(obj.section as BulletRef["section"])) {
    throw new InvalidResumeJsonError("Unknown bullet section");
  }
  return {
    section: obj.section as BulletRef["section"],
    entry: asIndex(obj.entry, "bullet entry"),
    bullet: asIndex(obj.bullet, "bullet index"),
  };
}

function parseKeywordEvidence(value: unknown, keyword: JdKeyword): KeywordEvidence {
  const obj = asObject(value, "keyword evidence");
  if (isSemanticKeyword(keyword)) {
    if (obj.kind !== "other") throw new InvalidResumeJsonError("Expected Other Keyword evidence");
    return { kind: "other", matchProbability: asFiniteNumber(obj.matchProbability, "Match Probability") };
  }
  if (obj.kind !== "skill") throw new InvalidResumeJsonError("Expected skill evidence");
  if (typeof obj.explicit !== "boolean") throw new InvalidResumeJsonError("Expected explicit to be a boolean");
  if (!Array.isArray(obj.placements) || !Array.isArray(obj.demonstratingBullets)) {
    throw new InvalidResumeJsonError("Expected placements and demonstrating Bullets to be arrays");
  }
  return {
    kind: "skill",
    explicit: obj.explicit,
    placements: obj.placements.map(parsePlacement),
    demonstratingBullets: obj.demonstratingBullets.map(parseBulletRef),
  };
}

/**
 * Validate a scoring pass from `/api/scoreResume` or a stored tailoring result.
 * Evidence must line up with `keywords` by index and by Keyword Category, or the
 * credit computation would misread it. Throws `InvalidResumeJsonError` on any mismatch.
 */
export function parseKeywordScoring(value: unknown, keywords: JdKeyword[]): KeywordScoring {
  const obj = asObject(value, "keyword scoring");
  if (obj.scoredBy !== "jev" && obj.scoredBy !== "keyword") {
    throw new InvalidResumeJsonError("Unknown scoring source");
  }
  if (!Array.isArray(obj.evidence) || obj.evidence.length !== keywords.length) {
    throw new InvalidResumeJsonError("Expected evidence for every keyword");
  }
  const evidence = obj.evidence;
  return {
    evidence: keywords.map((keyword, index) => parseKeywordEvidence(evidence[index], keyword)),
    scoredBy: obj.scoredBy,
  };
}

/**
 * Normalize `{ resume, keywords }` from Claude or `/api/renderResume`.
 * Keyword rules live in `parseKeywords`.
 */
export function parseTailoredResponse(input: unknown): TailoredResumeResponse {
  const obj = asObject(input, "tailored resume response");
  return {
    resume: parseResumeContent(obj.resume),
    keywords: parseKeywords(obj.keywords),
  };
}
