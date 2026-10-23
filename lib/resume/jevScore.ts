import type {
    JdKeyword,
    KeywordEvidence,
    KeywordScoring,
    PlacementEntrySection,
    PlacementEvidence,
    PlacementSource,
    ResumeContent,
    SkillEvidence,
} from "./schema";
import { SECTION_TITLES } from "./schema";
import {
    DEPTH_LEVEL_NAMES,
    estimateKeywordEvidence,
    explicitSkillEvidence,
    findLiteralPlacements,
    isExplicitSkill,
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

const SENSE_CRITERIA = {
    true: "The words name the skill itself, as a tool, technology, method, or practice (e.g. \"Go\" in a list of programming languages, or \"built services in Go\").",
    false: "The words mean something else (e.g. \"Go\" in \"go-to-market\", \"Spring\" in \"Spring 2024\"), or are only part of a name that is not the skill.",
};

export type ScoreKeywordsOptions = {
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
};

type EntrySource = { section: PlacementEntrySection; entry: number };

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

/** How a sense check points at its Placement inside the whole resume. */
function placementName(source: PlacementSource, resume: ResumeContent): string {
    if (source.section === "education") {
        const { degree, institution } = resume.education[source.entry];
        return `the Education Entry "${[degree, institution].filter(Boolean).join(", ")}"`;
    }
    return `the ${SECTION_TITLES[source.section]} section`;
}

function buildSenseQuestion(keyword: JdKeyword, source: PlacementSource, resume: ResumeContent) {
    return {
        type: "noul" as const,
        instructions: `In ${placementName(source, resume)}, is ${keywordLabel(keyword)} named in that sense, as the skill itself?`,
        criteria: SENSE_CRITERIA,
    };
}

type JevQuestion =
    | ReturnType<typeof buildDepthQuestion>
    | ReturnType<typeof buildMatchQuestion>
    | ReturnType<typeof buildPresenceQuestion>
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

/** Only this Entry, so Jev can't credit it for another Entry's content. */
function entryState(resume: ResumeContent, source: EntrySource) {
    if (source.section === "experience") {
        const { title, company, dates, bullets } = resume.experience[source.entry];
        return { title, company, dates, bullets };
    }
    if (source.section === "education") {
        const { institution, degree, dates, bullets } = resume.education[source.entry];
        return { institution, degree, dates, bullets };
    }
    const { name, technologies, dates, bullets } = resume.projects[source.entry];
    return { name, technologies, dates, bullets };
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
 * Whole resume: Match Probability for every Other Keyword, Depth Level for every Explicit Soft Skill,
 * and a sense check for every Hard Skill named in the Professional Summary, Education, or Honors.
 */
function buildResumeQuestions(keywords: JdKeyword[], resume: ResumeContent): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (isSemanticKeyword(keyword)) {
            questions[questionKey(index)] = buildMatchQuestion(keyword);
        } else if (isHardSkill(keyword)) {
            for (const source of senseCheckedPlacements(keyword, resume)) {
                questions[senseKey(index, source)] = buildSenseQuestion(keyword, source, resume);
            }
        } else if (isExplicitSkill(keyword, resume)) {
            questions[questionKey(index)] = buildDepthQuestion(keyword, "the resume text");
        }
    });
    return questions;
}

/** Every Hard Skill gets a presence and a Depth Level question in each Work History Entry. */
function buildEntryQuestions(keywords: JdKeyword[]): JevQuestions {
    const questions: JevQuestions = {};
    keywords.forEach((keyword, index) => {
        if (!isHardSkill(keyword)) return;
        questions[presenceKey(index)] = buildPresenceQuestion(keyword);
        questions[entryDepthKey(index)] = buildDepthQuestion(keyword, "this Entry");
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

/**
 * One Placement per Work History Entry with its presence and Depth Level, plus each literal Skills
 * Listing: an Education Entry at its own Depth Level, a Professional Summary, Technical Skills, or
 * Honors match at Mentioned. Outside Work History, presence is the sense check, or 1 in Technical Skills.
 * Explicit when a literal Placement counts.
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
    const presenceAt = (source: PlacementSource): number =>
        source.section === "skills" ? 1 : answerField(resumeAnswers[senseKey(index, source)], "noul");
    const listings: PlacementEvidence[] = literal
        .filter((source) => !isWorkHistory(source))
        .map((source) => ({ source, presence: presenceAt(source), depthLevel: depthAt(source) }));
    const explicit = [...workHistory, ...listings].some(
        (placement) =>
            placement.presence >= PRESENCE_CUTOFF &&
            literal.some((source) => isSamePlacementSource(source, placement.source)),
    );
    return { kind: "skill", explicit, placements: [...workHistory, ...listings], demonstratingBullets: [] };
}

function evidenceFromAnswers(
    keywords: JdKeyword[],
    resume: ResumeContent,
    resumeAnswers: JevAnswers,
    entryAnswers: EntryAnswers[],
): KeywordEvidence[] {
    return keywords.map((keyword, index): KeywordEvidence => {
        const answer = resumeAnswers[questionKey(index)];
        if (isSemanticKeyword(keyword)) {
            return { kind: "other", matchProbability: answerField(answer, "noul") };
        }
        if (isHardSkill(keyword)) {
            return hardSkillEvidence(keyword, index, resume, resumeAnswers, entryAnswers);
        }
        if (!isExplicitSkill(keyword, resume)) {
            return { kind: "skill", explicit: false, placements: [], demonstratingBullets: [] };
        }
        return explicitSkillEvidence(keyword, resume, scoreToLevel(answerField(answer, "score")));
    });
}

async function scoreKeywordsWithJev(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions,
): Promise<KeywordEvidence[]> {
    const entryQuestions = buildEntryQuestions(keywords);
    const requests = [
        ...(Object.keys(entryQuestions).length === 0 ? [] : workHistorySources(resume)).map((source) => ({
            source,
            questions: entryQuestions,
        })),
        ...educationSources(resume).map((source) => ({
            source,
            questions: buildEducationQuestions(keywords, resume, source),
        })),
    ];
    const sources = requests.map(({ source }) => source);
    const [resumeAnswers, ...answersPerEntry] = await Promise.all([
        askIfAny(resumeState(resume), buildResumeQuestions(keywords, resume), options),
        ...requests.map(({ source, questions }) => askIfAny(entryState(resume, source), questions, options)),
    ]);
    const entryAnswers = sources.map((source, i) => ({ source, answers: answersPerEntry[i] }));
    return evidenceFromAnswers(keywords, resume, resumeAnswers, entryAnswers);
}

/**
 * Parallel Jev requests, all-or-nothing:
 * - one per Experience and Projects Entry, whose state is only that Entry: presence and Depth Level
 *   of every Hard Skill;
 * - one with the whole resume: Match Probability of every Other Keyword, Depth Level of every
 *   Explicit Soft Skill, and Depth Level of Hard Skills named outside Work History.
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
