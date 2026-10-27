import type {
    BulletRef,
    EntrySource,
    JdKeyword,
    KeywordEvidence,
    KeywordScoring,
    PlacementEvidence,
    PlacementSource,
    ResumeContent,
    SkillEvidence,
} from "./schema";
import { SECTION_TITLES } from "./schema";
import { entryLabel, entryState } from "./entryFields";
import {
    DEPTH_LEVEL_NAMES,
    estimateKeywordEvidence,
    findLiteralPlacements,
    isSamePlacementSource,
    isSemanticKeyword,
    isWorkHistory,
    MAX_DEPTH_LEVEL,
    MENTIONED_LEVEL,
    PRESENCE_CUTOFF,
    resolveCategory,
} from "./keywordMatch";

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";
export const JEV_TIMEOUT_MS = 15_000;

/** Aligned with `DEPTH_LEVEL_NAMES`. Absent is asked separately (presence), so there is no Absent level. */
const DEPTH_LEVEL_DESCRIPTIONS = [
    "The skill is named, but the resume gives little or no evidence of practical application (e.g. listed in a skills section, or named without describing its use). Do not assume proficiency from a keyword alone.",
    "Introductory exposure through coursework, tutorials, basic exercises, or limited participation, without substantial independent application (e.g. a basic lab or a small tutorial project).",
    "Practical use in a project, implementation, or professional environment, with stated responsibilities, ownership, or outcomes (e.g. deploying an application, building REST APIs, implementing authentication, designing a system, or optimizing performance).",
] as const;

export const DEPTH_LEVEL_CRITERIA = DEPTH_LEVEL_NAMES.map(
    (name, i) => `${name}: ${DEPTH_LEVEL_DESCRIPTIONS[i]}`,
);

const DEPTH_GUIDANCE =
    "Judge only what the work shows. Do not infer depth from a senior job title, a long employment duration, or a list of technologies.";

const MATCH_CRITERIA = {
    true: "The resume states or clearly shows it, in any wording: an equivalent degree or certification name, an abbreviation, or dates that add up to the required experience. A degree in progress or with an expected graduation date meets a degree requirement.",
    false: "The resume does not show it, or shows only something weaker or different (e.g. a different field of study, or fewer years than required).",
};

const PRESENCE_CRITERIA = {
    true: "The Entry describes the candidate's own work using it, either by name or through something that clearly is it (e.g. running services on EKS with Helm uses Kubernetes; writing goroutines uses Go).",
    false: "The Entry does not show it in use, shows only something related but different (e.g. using a website built with React is not using React), or the word appears in another sense (e.g. \"Go\" in \"go-to-market\" is not the Go language).",
};

const SENSE_CRITERIA = {
    true: "The words name the skill itself, as a tool, technology, method, or practice (e.g. \"Go\" in a list of programming languages, or \"built services in Go\").",
    false: "The words mean something else (e.g. \"Go\" in \"go-to-market\", \"Spring\" in \"Spring 2024\"), or are only part of a name that is not the skill.",
};

const TRAIT_SENSE_CRITERIA = {
    true: "The words describe the candidate's own interpersonal or work-style quality, even as a plain claim (e.g. \"strong communicator\", \"known for ownership of on-call\").",
    false: "The words mean something else (e.g. \"Communication\" in \"BA, Communication Studies\", \"ownership\" in \"home ownership data\"), or are only part of a name that is not the trait.",
};

const DEMONSTRATION_CRITERIA = {
    true: "The Bullet describes something the candidate did that is clearly an instance of the trait, and the trait is a main point of the Bullet (e.g. \"Led 4 engineers through a database migration\" for Leadership; \"Negotiated scope between design and sales to unblock a launch\" for Communication).",
    false: "The trait is only something any competent work involves, is claimed without an example (e.g. \"Strong communicator and team player\"), or is not what the Bullet is about (e.g. \"Built a REST API in Go\" is not an example of Teamwork or Problem Solving).",
};

export type ScoreKeywordsOptions = {
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
};

function keywordLabel(keyword: JdKeyword): string {
    if (keyword.aliases.length === 0) return keyword.term;
    return `${keyword.term} (also: ${keyword.aliases.join(", ")})`;
}

function isHardSkill(keyword: JdKeyword): boolean {
    return resolveCategory(keyword.category) === "hard";
}

function buildDepthQuestion(keyword: JdKeyword, scope: "the resume text" | "this Entry") {
    const label = keywordLabel(keyword);
    return {
        type: "score" as const,
        instructions: [
            `On a scale of 1 to ${MAX_DEPTH_LEVEL}, rate the depth of the candidate's practical use of ${label} based on ${scope}:`,
            ...DEPTH_LEVEL_CRITERIA.map((criterion, i) => `${i + 1} = ${criterion}`),
            DEPTH_GUIDANCE,
        ].join("\n"),
        criteria: [...DEPTH_LEVEL_CRITERIA],
    };
}

function buildMatchQuestion(keyword: JdKeyword) {
    return {
        type: "noul" as const,
        instructions: `Does the resume show that the candidate meets this job requirement: ${keyword.clause || keywordLabel(keyword)}?`,
        criteria: MATCH_CRITERIA,
    };
}

function buildPresenceQuestion(keyword: JdKeyword) {
    return {
        type: "noul" as const,
        instructions: `Does this Entry show the candidate using ${keywordLabel(keyword)}, in that sense, whether or not it is named?`,
        criteria: PRESENCE_CRITERIA,
    };
}

/** `bullet` indexes the `bullets` of the one Entry in the request's state. */
function buildDemonstrationQuestion(keyword: JdKeyword, bullet: number) {
    const label = keywordLabel(keyword);
    return {
        type: "noul" as const,
        instructions: `Would a recruiter cite \`bullets[${bullet}]\` as a specific example of the candidate's ${label}? Yes only if ${label} is a main point of that Bullet, not something any competent work involves.`,
        criteria: DEMONSTRATION_CRITERIA,
    };
}

/** How a sense check points at its Placement inside the whole resume. */
function placementName(source: PlacementSource, resume: ResumeContent): string {
    if ("entry" in source) {
        return `the ${SECTION_TITLES[source.section]} Entry "${entryLabel(resume, source)}"`;
    }
    return `the ${SECTION_TITLES[source.section]} section`;
}

function buildSenseQuestion(keyword: JdKeyword, source: PlacementSource, resume: ResumeContent) {
    const label = keywordLabel(keyword);
    const where = placementName(source, resume);
    if (!isHardSkill(keyword)) {
        return {
            type: "noul" as const,
            instructions: `Where ${where} mentions ${label}, does it describe the candidate's ${label} as a personal trait (an interpersonal or work-style quality), rather than a word with another meaning?`,
            criteria: TRAIT_SENSE_CRITERIA,
        };
    }
    return {
        type: "noul" as const,
        instructions: `Where ${where} mentions ${label}, does it mean ${label} the skill (a tool, technology, method, or practice), rather than a word with another meaning?`,
        criteria: SENSE_CRITERIA,
    };
}

type JevQuestion =
    | ReturnType<typeof buildDepthQuestion>
    | ReturnType<typeof buildMatchQuestion>
    | ReturnType<typeof buildPresenceQuestion>
    | ReturnType<typeof buildDemonstrationQuestion>
    | ReturnType<typeof buildSenseQuestion>;
type JevQuestions = Record<string, JevQuestion>;
type JevAnswers = Record<string, unknown>;

function resumeState(resume: ResumeContent) {
    return {
        summary: resume.summary,
        education: resume.education,
        experience: resume.experience,
        projects: resume.projects,
        skills: resume.skills,
        honors: resume.honors,
    };
}

function entryBullets(resume: ResumeContent, source: EntrySource): string[] {
    return resume[source.section][source.entry].bullets;
}

function workHistorySources(resume: ResumeContent): EntrySource[] {
    return [
        ...resume.experience.map((_, entry) => ({ section: "experience" as const, entry })),
        ...resume.projects.map((_, entry) => ({ section: "projects" as const, entry })),
    ];
}

function educationSources(resume: ResumeContent): EntrySource[] {
    return resume.education.map((_, entry) => ({ section: "education" as const, entry }));
}

function namesLiterally(keyword: JdKeyword, resume: ResumeContent, source: EntrySource): boolean {
    return findLiteralPlacements(keyword, resume).some((literal) => isSamePlacementSource(literal, source));
}

function questionKey(index: number): string {
    return `kw_${index}`;
}

function presenceKey(index: number): string {
    return `kw_${index}_presence`;
}

function entryDepthKey(index: number): string {
    return `kw_${index}_depth`;
}

function demonstrationKey(index: number, bullet: number): string {
    return `kw_${index}_b${bullet}`;
}

function senseKey(index: number, source: PlacementSource): string {
    return "entry" in source ? `kw_${index}_sense_${source.section}_${source.entry}` : `kw_${index}_sense_${source.section}`;
}

/** Literal matches outside Work History that get a sense check; Technical Skills matches are trusted. */
function senseCheckedPlacements(keyword: JdKeyword, resume: ResumeContent): PlacementSource[] {
    return findLiteralPlacements(keyword, resume).filter(
        (source) => !isWorkHistory(source) && source.section !== "skills",
    );
}

/** Jev score is 0–2 (criteria length − 1). Level is 1–3. Keep fractions. */
export function scoreToLevel(score: number): number {
    if (!Number.isFinite(score)) {
        throw new Error("Invalid Jev score");
    }
    return Math.min(MAX_DEPTH_LEVEL, Math.max(1, score + 1));
}

function answerField(answer: unknown, field: "score" | "noul"): number {
    if (answer === null || typeof answer !== "object") {
        throw new Error(`Missing Jev ${field} answer`);
    }
    const value = (answer as Record<string, unknown>)[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Invalid Jev ${field} answer`);
    }
    return value;
}

/**
 * Whole resume: Match Probability for every Other Keyword, and a sense check for every Hard or Soft
 * Skill named in the Professional Summary, an Education Entry, or Licenses, Certifications, and Awards.
 */
function buildResumeQuestions(keywords: JdKeyword[], resume: ResumeContent): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (isSemanticKeyword(keyword)) {
            questions[questionKey(index)] = buildMatchQuestion(keyword);
            return;
        }
        for (const source of senseCheckedPlacements(keyword, resume)) {
            questions[senseKey(index, source)] = buildSenseQuestion(keyword, source, resume);
        }
    });
    return questions;
}

/**
 * In each Work History Entry: a presence and a Depth Level question for every Hard Skill, and for
 * every Soft Skill one question per Bullet asking whether it is a specific example of the trait.
 */
function buildEntryQuestions(keywords: JdKeyword[], bulletCount: number): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (isSemanticKeyword(keyword)) return;
        if (isHardSkill(keyword)) {
            questions[presenceKey(index)] = buildPresenceQuestion(keyword);
            questions[entryDepthKey(index)] = buildDepthQuestion(keyword, "this Entry");
            return;
        }
        for (let bullet = 0; bullet < bulletCount; bullet++) {
            questions[demonstrationKey(index, bullet)] = buildDemonstrationQuestion(keyword, bullet);
        }
    });
    return questions;
}

/** Depth Level only for the Hard Skills this Education Entry names: Education never implies a skill. */
function buildEducationQuestions(keywords: JdKeyword[], resume: ResumeContent, source: EntrySource): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (!isHardSkill(keyword) || !namesLiterally(keyword, resume, source)) return;
        questions[entryDepthKey(index)] = buildDepthQuestion(keyword, "this Entry");
    });
    return questions;
}

async function askJev(
    state: object,
    questions: JevQuestions,
    options: ScoreKeywordsOptions,
): Promise<JevAnswers> {
    const apiKey = (options.apiKey ?? process.env.TYPESAFE_API_KEY)?.trim();
    if (!apiKey) {
        throw new Error("TYPESAFE_API_KEY is not set");
    }
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? JEV_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const fetchFn = options.fetch ?? fetch;
    try {
        const response = await fetchFn(JEV_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: JEV_MODEL, state, questions }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => "");
            throw new Error(`Jev request failed (${response.status}): ${detail.slice(0, 500)}`);
        }
        const payload = (await response.json()) as { answers?: unknown };
        if (!payload.answers || typeof payload.answers !== "object") {
            throw new Error("Jev response missing answers");
        }
        return payload.answers as JevAnswers;
    } finally {
        clearTimeout(timeout);
    }
}

async function askIfAny(state: object, questions: JevQuestions, options: ScoreKeywordsOptions): Promise<JevAnswers> {
    return Object.keys(questions).length === 0 ? {} : askJev(state, questions, options);
}

type EntryAnswers = { source: EntrySource; answers: JevAnswers };

/** Presence of a literal match outside Work History: its sense check, or 1 in Technical Skills. */
function listingPresence(index: number, source: PlacementSource, resumeAnswers: JevAnswers): number {
    return source.section === "skills" ? 1 : answerField(resumeAnswers[senseKey(index, source)], "noul");
}

/** Explicit when some literal match counts: it passed its sense check, or sits in Technical Skills. */
function isNamedInThatSense(placements: PlacementEvidence[], literal: PlacementSource[]): boolean {
    return placements.some(
        (placement) =>
            placement.presence >= PRESENCE_CUTOFF &&
            literal.some((source) => isSamePlacementSource(source, placement.source)),
    );
}

/**
 * One Placement per Work History Entry with its presence and Depth Level, plus each literal Skills
 * Listing: an Education Entry at its own Depth Level, or a Professional Summary, Technical Skills, or
 * Licenses, Certifications, and Awards match at Mentioned.
 */
function hardSkillEvidence(
    keyword: JdKeyword,
    index: number,
    resume: ResumeContent,
    resumeAnswers: JevAnswers,
    entryAnswers: EntryAnswers[],
): SkillEvidence {
    const literal = findLiteralPlacements(keyword, resume);
    const workHistory: PlacementEvidence[] = entryAnswers
        .filter(({ source }) => isWorkHistory(source))
        .map(({ source, answers }) => ({
            source,
            presence: answerField(answers[presenceKey(index)], "noul"),
            depthLevel: scoreToLevel(answerField(answers[entryDepthKey(index)], "score")),
        }));
    const depthAt = (source: PlacementSource): number => {
        const entry = entryAnswers.find((answered) => isSamePlacementSource(answered.source, source));
        return entry ? scoreToLevel(answerField(entry.answers[entryDepthKey(index)], "score")) : MENTIONED_LEVEL;
    };
    const listings: PlacementEvidence[] = literal
        .filter((source) => !isWorkHistory(source))
        .map((source) => ({ source, presence: listingPresence(index, source, resumeAnswers), depthLevel: depthAt(source) }));
    const placements = [...workHistory, ...listings];
    return { kind: "skill", explicit: isNamedInThatSense(placements, literal), placements, demonstratingBullets: [] };
}

/**
 * Applied / Production in each Work History Entry with a demonstrating Bullet (presence = its best
 * Bullet's answer), Mentioned in each other Entry that names it, and Mentioned in each Skills Listing
 * that names it.
 */
function softSkillEvidence(
    keyword: JdKeyword,
    index: number,
    resume: ResumeContent,
    resumeAnswers: JevAnswers,
    entryAnswers: EntryAnswers[],
): SkillEvidence {
    const literal = findLiteralPlacements(keyword, resume);
    const isNamedIn = (source: PlacementSource) => literal.some((named) => isSamePlacementSource(named, source));
    const demonstratingBullets: BulletRef[] = [];
    const workHistory = entryAnswers.flatMap(({ source, answers }): PlacementEvidence[] => {
        if (!isWorkHistory(source)) return [];
        const { section, entry } = source;
        const exampleProbabilities = entryBullets(resume, source).map((_, bullet) =>
            answerField(answers[demonstrationKey(index, bullet)], "noul"),
        );
        exampleProbabilities.forEach((probability, bullet) => {
            if (probability >= PRESENCE_CUTOFF) demonstratingBullets.push({ section, entry, bullet });
        });
        const presence = Math.max(0, ...exampleProbabilities);
        if (presence < PRESENCE_CUTOFF && isNamedIn(source)) {
            return [{ source, presence: 1, depthLevel: MENTIONED_LEVEL }];
        }
        return [{ source, presence, depthLevel: MAX_DEPTH_LEVEL }];
    });
    const listings: PlacementEvidence[] = literal
        .filter((source) => !isWorkHistory(source))
        .map((source) => ({ source, presence: listingPresence(index, source, resumeAnswers), depthLevel: MENTIONED_LEVEL }));
    const placements = [...workHistory, ...listings];
    return { kind: "skill", explicit: isNamedInThatSense(placements, literal), placements, demonstratingBullets };
}

function evidenceFromAnswers(
    keywords: JdKeyword[],
    resume: ResumeContent,
    resumeAnswers: JevAnswers,
    entryAnswers: EntryAnswers[],
): KeywordEvidence[] {
    return keywords.map((keyword, index): KeywordEvidence => {
        if (isSemanticKeyword(keyword)) {
            return { kind: "other", matchProbability: answerField(resumeAnswers[questionKey(index)], "noul") };
        }
        if (isHardSkill(keyword)) {
            return hardSkillEvidence(keyword, index, resume, resumeAnswers, entryAnswers);
        }
        return softSkillEvidence(keyword, index, resume, resumeAnswers, entryAnswers);
    });
}

async function scoreKeywordsWithJev(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions,
): Promise<KeywordEvidence[]> {
    const requests = [
        ...workHistorySources(resume).map((source) => ({
            source,
            questions: buildEntryQuestions(keywords, entryBullets(resume, source).length),
        })),
        ...educationSources(resume).map((source) => ({
            source,
            questions: buildEducationQuestions(keywords, resume, source),
        })),
    ];
    const [resumeAnswers, ...answersPerEntry] = await Promise.all([
        askIfAny(resumeState(resume), buildResumeQuestions(keywords, resume), options),
        ...requests.map(({ source, questions }) => askIfAny(entryState(resume, source), questions, options)),
    ]);
    const entryAnswers = requests.map(({ source }, i) => ({ source, answers: answersPerEntry[i] }));
    return evidenceFromAnswers(keywords, resume, resumeAnswers, entryAnswers);
}

/**
 * Parallel Jev requests, all-or-nothing:
 * - one per Experience and Projects Entry, whose state is only that Entry: presence and Depth Level
 *   of every Hard Skill, and whether each Bullet is a specific example of each Soft Skill;
 * - one per Education Entry, whose state is only that Entry: Depth Level of the Hard Skills it names;
 * - one with the whole resume: Match Probability of every Other Keyword, and a sense check for each
 *   Hard or Soft Skill named in the Professional Summary, an Education Entry, or Licenses,
 *   Certifications, and Awards. Technical Skills matches are trusted.
 * Requests with no questions are not sent.
 * Never throws: missing key / timeout / any failed request → `estimateKeywordEvidence` for every Keyword.
 */
export async function scoreKeywords(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions = {},
): Promise<KeywordScoring> {
    if (keywords.length === 0) {
        return { evidence: [], scoredBy: "keyword" };
    }
    try {
        return { evidence: await scoreKeywordsWithJev(keywords, resume, options), scoredBy: "jev" };
    } catch (error) {
        console.error("Jev keyword scoring failed, using exact-wording fallback:", error);
        return {
            evidence: estimateKeywordEvidence(keywords, resume),
            scoredBy: "keyword",
        };
    }
}
