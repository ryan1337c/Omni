import type { JdKeyword, KeywordScoring, ResumeContent } from "./schema";
import { estimateKeywordLevels } from "./keywordMatch";

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";
export const JEV_TIMEOUT_MS = 15_000;

export const RUBRIC_LEVELS = [
    "Absent: No mention or implicit evidence.",
    "Passive/Listed: Listed in a skills section or mentioned without project details.",
    "Applied: Used in a project or work duty with contextual details.",
    "Core/Production: Central tool utilized to build, optimize, or deploy production-level features or systems.",
  ] as const;

export type ScoreKeywordsOptions = {
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
};

function keywordLabel(keyword: JdKeyword): string {
    if (keyword.aliases.length === 0) return keyword.term;
    return `${keyword.term} (also: ${keyword.aliases.join(", ")})`;
}

function buildQuestion(keyword: JdKeyword) {
    const label = keywordLabel(keyword);
    return {
        type: "score" as const,
        instructions: [
        `On a scale of 1 to 4, rate the candidate's level of practical application of ${label} based on the resume text:`,
        ...RUBRIC_LEVELS.map((level, i) => `${i + 1} = ${level}`),
        ].join("\n"),
        criteria: [...RUBRIC_LEVELS],
    };
}

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

/** Jev score is 0–3 (criteria length − 1). Level is 1–4. Keep fractions. */
export function scoreToLevel(score: number): number {
    if (!Number.isFinite(score)) {
        throw new Error("Invalid Jev score");
    }
    return Math.min(4, Math.max(1, score + 1));
}

function parseScoreAnswer(answer: unknown): number {
    if (answer === null || typeof answer !== "object") {
        throw new Error("Missing Jev score answer");
    }
    const score = (answer as { score?: unknown }).score;
    if (typeof score !== "number" || !Number.isFinite(score)) {
        throw new Error("Invalid Jev score answer");
    }
    return scoreToLevel(score);
}

async function scoreKeywordsWithJev(
keywords: JdKeyword[],
resume: ResumeContent,
options: ScoreKeywordsOptions = {},
): Promise<number[]> {
    const apiKey = (options.apiKey ?? process.env.TYPESAFE_API_KEY)?.trim();
    if (!apiKey) {
        throw new Error("TYPESAFE_API_KEY is not set");
    }
    const questions: Record<string, ReturnType<typeof buildQuestion>> = {};
    keywords.forEach((keyword, index) => {
        questions[questionKey(index)] = buildQuestion(keyword);
    });
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
        const answers = payload.answers as Record<string, unknown>;
        return keywords.map((_, index) => parseScoreAnswer(answers[questionKey(index)]));
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Scores every keyword in one Jev request.
 * Never throws: missing key / timeout / API failure → string-match fallback.
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
        const levels = await scoreKeywordsWithJev(keywords, resume, options);
        return { levels, scoredBy: "jev" };
    } catch (error) {
        console.error("Jev keyword scoring failed, using string-match fallback:", error);
        return {
        levels: estimateKeywordLevels(keywords, resume),
        scoredBy: "keyword",
        };
    }
}