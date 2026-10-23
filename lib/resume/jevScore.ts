import type {
    BulletRef,
    JdKeyword,
    KeywordEvidence,
    KeywordScoring,
    PlacementEvidence,
    ResumeContent,
    SkillEvidence,
} from "./schema";
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

const DEMONSTRATION_CRITERIA = {
    true: "The Bullet describes something the candidate did that is clearly an instance of the trait, and the trait is a main point of the Bullet (e.g. \"Led 4 engineers through a database migration\" for Leadership; \"Negotiated scope between design and sales to unblock a launch\" for Communication).",
    false: "The trait is only something any competent work involves, is claimed without an example (e.g. \"Strong communicator and team player\"), or is not what the Bullet is about (e.g. \"Built a REST API in Go\" is not an example of Teamwork or Problem Solving).",
};

export type ScoreKeywordsOptions = {
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
};

type WorkHistorySource = { section: "experience" | "projects"; entry: number };

function keywordLabel(keyword: JdKeyword): string {
    if (keyword.aliases.length === 0) return keyword.term;
    return `${keyword.term} (also: ${keyword.aliases.join(", ")})`;
}

function isHardSkill(keyword: JdKeyword): boolean {
    return keyword.category === "hard";
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
        instructions: `Does the resume show that the candidate meets this job requirement: ${keywordLabel(keyword)}?`,
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

type JevQuestion =
    | ReturnType<typeof buildDepthQuestion>
    | ReturnType<typeof buildMatchQuestion>
    | ReturnType<typeof buildPresenceQuestion>
    | ReturnType<typeof buildDemonstrationQuestion>;
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

/** Only this Entry, so Jev can't credit it for another Entry's content. */
function entryState(resume: ResumeContent, source: WorkHistorySource) {
    if (source.section === "experience") {
        const { title, company, dates, bullets } = resume.experience[source.entry];
        return { title, company, dates, bullets };
    }
    const { name, technologies, dates, bullets } = resume.projects[source.entry];
    return { name, technologies, dates, bullets };
}

function entryBullets(resume: ResumeContent, source: WorkHistorySource): string[] {
    return resume[source.section][source.entry].bullets;
}

function workHistorySources(resume: ResumeContent): WorkHistorySource[] {
    return [
        ...resume.experience.map((_, entry) => ({ section: "experience" as const, entry })),
        ...resume.projects.map((_, entry) => ({ section: "projects" as const, entry })),
    ];
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

/** Hard Skills named literally outside Work History; their Depth Level there comes from the whole resume. */
function hasLiteralSkillsListing(keyword: JdKeyword, resume: ResumeContent): boolean {
    return findLiteralPlacements(keyword, resume).some((source) => !isWorkHistory(source));
}

/**
 * Whole resume: Match Probability for every Other Keyword, and Depth Level for every Hard Skill
 * named outside Work History.
 */
function buildResumeQuestions(keywords: JdKeyword[], resume: ResumeContent): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (isSemanticKeyword(keyword)) {
            questions[questionKey(index)] = buildMatchQuestion(keyword);
        } else if (isHardSkill(keyword) && hasLiteralSkillsListing(keyword, resume)) {
            questions[questionKey(index)] = buildDepthQuestion(keyword, "the resume text");
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

type EntryAnswers = { source: WorkHistorySource; answers: JevAnswers };

/**
 * One Placement per Work History Entry with its presence and Depth Level, plus each literal
 * Skills Listing or Education Placement at the whole-resume Depth Level (presence 1).
 * Explicit when a literal Placement counts: outside Work History, or an Entry where Jev confirmed the sense.
 */
function hardSkillEvidence(
    keyword: JdKeyword,
    index: number,
    resume: ResumeContent,
    resumeAnswers: JevAnswers,
    entryAnswers: EntryAnswers[],
): SkillEvidence {
    const literal = findLiteralPlacements(keyword, resume);
    const workHistory: PlacementEvidence[] = entryAnswers.map(({ source, answers }) => ({
        source,
        presence: answerField(answers[presenceKey(index)], "noul"),
        depthLevel: scoreToLevel(answerField(answers[entryDepthKey(index)], "score")),
    }));
    const listed = literal.filter((source) => !isWorkHistory(source));
    const listingDepth =
        listed.length === 0 ? 0 : scoreToLevel(answerField(resumeAnswers[questionKey(index)], "score"));
    const listings: PlacementEvidence[] = listed.map((source) => ({ source, presence: 1, depthLevel: listingDepth }));
    const explicit =
        listings.length > 0 ||
        workHistory.some(
            (placement) =>
                placement.presence >= PRESENCE_CUTOFF &&
                literal.some((source) => isSamePlacementSource(source, placement.source)),
        );
    return { kind: "skill", explicit, placements: [...workHistory, ...listings], demonstratingBullets: [] };
}

/**
 * Applied / Production in each Work History Entry with a demonstrating Bullet (presence = its best
 * Bullet's answer), Mentioned in each other Entry or Skills Listing that names it.
 * Explicit when named anywhere, whether or not the naming Bullet is an example.
 */
function softSkillEvidence(
    keyword: JdKeyword,
    index: number,
    resume: ResumeContent,
    entryAnswers: EntryAnswers[],
): SkillEvidence {
    const literal = findLiteralPlacements(keyword, resume);
    const isNamedIn = (source: PlacementEvidence["source"]) =>
        literal.some((named) => isSamePlacementSource(named, source));
    const demonstratingBullets: BulletRef[] = [];
    const workHistory = entryAnswers.map(({ source, answers }): PlacementEvidence => {
        const yes = entryBullets(resume, source).map((_, bullet) =>
            answerField(answers[demonstrationKey(index, bullet)], "noul"),
        );
        yes.forEach((probability, bullet) => {
            if (probability >= PRESENCE_CUTOFF) demonstratingBullets.push({ ...source, bullet });
        });
        const presence = Math.max(0, ...yes);
        if (presence < PRESENCE_CUTOFF && isNamedIn(source)) {
            return { source, presence: 1, depthLevel: MENTIONED_LEVEL };
        }
        return { source, presence, depthLevel: MAX_DEPTH_LEVEL };
    });
    const listings: PlacementEvidence[] = literal
        .filter((source) => !isWorkHistory(source))
        .map((source) => ({ source, presence: 1, depthLevel: MENTIONED_LEVEL }));
    return {
        kind: "skill",
        explicit: literal.length > 0,
        placements: [...workHistory, ...listings],
        demonstratingBullets,
    };
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
        return softSkillEvidence(keyword, index, resume, entryAnswers);
    });
}

async function scoreKeywordsWithJev(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions,
): Promise<KeywordEvidence[]> {
    const sources = workHistorySources(resume);
    const [resumeAnswers, ...answersPerEntry] = await Promise.all([
        askIfAny(resumeState(resume), buildResumeQuestions(keywords, resume), options),
        ...sources.map((source) =>
            askIfAny(
                entryState(resume, source),
                buildEntryQuestions(keywords, entryBullets(resume, source).length),
                options,
            ),
        ),
    ]);
    const entryAnswers = sources.map((source, i) => ({ source, answers: answersPerEntry[i] }));
    return evidenceFromAnswers(keywords, resume, resumeAnswers, entryAnswers);
}

/**
 * Parallel Jev requests, all-or-nothing:
 * - one per Experience and Projects Entry, whose state is only that Entry: presence and Depth Level
 *   of every Hard Skill, and whether each Bullet is a specific example of each Soft Skill;
 * - one with the whole resume: Match Probability of every Other Keyword, and Depth Level of Hard
 *   Skills named outside Work History.
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
