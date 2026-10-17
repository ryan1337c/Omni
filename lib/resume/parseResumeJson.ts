import type {
  EducationEntry,
  ExperienceEntry,
  JdKeyword,
  KeywordCategory,
  ProjectEntry,
  ResumeContent,
  ResumeHeader,
  SkillEntry,
  TailoredResumeResponse,
} from "./schema";

// Caps so a huge or malformed model payload cannot explode later LaTeX/PDF work.
const MAX_HEADER_NAME = 120;
const MAX_HEADER_FIELD = 200;
const MAX_LINE_FIELD = 200;
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
 */
export function parseResumeContent(input: unknown): ResumeContent {
  const obj = asObject(input, "resume");
  return {
    header: parseHeader(obj.header),
    education: mapEntries(obj.education, parseEducation),
    experience: mapEntries(obj.experience, parseExperience),
    projects: mapEntries(obj.projects, parseProject),
    skills: mapEntries(obj.skills, parseSkill),
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
