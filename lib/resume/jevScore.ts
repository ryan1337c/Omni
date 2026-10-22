import type { JdKeyword, KeywordScoring, ResumeContent } from "./schema";
import {
    ABSENT_LEVEL,
    DEPTH_LEVEL_NAMES,
    estimateKeywordLevels,
    isExplicitSkill,
    isSemanticKeyword,
    MAX_DEPTH_LEVEL,
} from "./keywordMatch";

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";
export const JEV_TIMEOUT_MS = 15_000;

/** Aligned with `DEPTH_LEVEL_NAMES`. Jev only sees Explicit Skills, so there is no Absent level. */
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

export type ScoreKeywordsOptions = {
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
};

function keywordLabel(keyword: JdKeyword): string {
    if (keyword.aliases.length === 0) return keyword.term;
    return `${keyword.term} (also: ${keyword.aliases.join(", ")})`;
}

function buildDepthQuestion(keyword: JdKeyword) {
    const label = keywordLabel(keyword);
    return {
        type: "score" as const,
        instructions: [
            `On a scale of 1 to ${MAX_DEPTH_LEVEL}, rate the depth of the candidate's practical use of ${label} based on the resume text:`,
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

type JevQuestion = ReturnType<typeof buildDepthQuestion> | ReturnType<typeof buildMatchQuestion>;

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

function questionKey(index: number): string {
    return `kw_${index}`;
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

/** Hard and Soft Skills get a depth question only when they are Explicit; Other Keywords always get a match question. */
function buildQuestions(keywords: JdKeyword[], resume: ResumeContent): Record<string, JevQuestion> {
    const questions: Record<string, JevQuestion> = {};
    keywords.forEach((keyword, index) => {
        if (isSemanticKeyword(keyword)) {
            questions[questionKey(index)] = buildMatchQuestion(keyword);
        } else if (isExplicitSkill(keyword, resume)) {
            questions[questionKey(index)] = buildDepthQuestion(keyword);
        }
    });
    return questions;
}

async function askJev(
    questions: Record<string, JevQuestion>,
    resume: ResumeContent,
    options: ScoreKeywordsOptions,
): Promise<Record<string, unknown>> {
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
            body: JSON.stringify({
                model: JEV_MODEL,
                state: resumeState(resume),
                questions,
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Jev request failed (${response.status})`);
        }
        const payload = (await response.json()) as { answers?: unknown };
        if (!payload.answers || typeof payload.answers !== "object") {
            throw new Error("Jev response missing answers");
        }
        return payload.answers as Record<string, unknown>;
    } finally {
        clearTimeout(timeout);
    }
}

async function scoreKeywordsWithJev(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions,
): Promise<number[]> {
    const questions = buildQuestions(keywords, resume);
    if (Object.keys(questions).length === 0) {
        return keywords.map(() => ABSENT_LEVEL);
    }
    const answers = await askJev(questions, resume, options);
    return keywords.map((keyword, index) => {
        const key = questionKey(index);
        if (!(key in questions)) return ABSENT_LEVEL;
        return isSemanticKeyword(keyword)
            ? answerField(answers[key], "noul")
            : scoreToLevel(answerField(answers[key], "score"));
    });
}

/**
 * One Jev request per resume: the Depth Level of every Explicit Skill, and the
 * Match Probability of every Other Keyword. Implied Skills are never sent and come back Absent.
 * Never throws: missing key / timeout / API failure → `estimateKeywordLevels`.
 */
export async function scoreKeywords(
    keywords: JdKeyword[],
    resume: ResumeContent,
    options: ScoreKeywordsOptions = {},
): Promise<KeywordScoring> {
    if (keywords.length === 0) {
        return { levels: [], scoredBy: "keyword" };
    }
    try {
        return { levels: await scoreKeywordsWithJev(keywords, resume, options), scoredBy: "jev" };
    } catch (error) {
        console.error("Jev keyword scoring failed, using string-match fallback:", error);
        return {
            levels: estimateKeywordLevels(keywords, resume),
            scoredBy: "keyword",
        };
    }
}
