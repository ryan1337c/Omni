import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/requireUser";
import {
    InvalidResumeJsonError,
    parseKeywords,
    parseResumeContent,
    scoreKeywords,
    type JdKeyword,
    type KeywordScoring,
    type ResumeContent,
} from "@/lib/resume";

type ErrorBody = {
    error?: string;
};

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "256kb",
        },
    },
    // Jev times out at 15s. Stay above that so a slow call can still return
    // its Mentioned fallback before the platform cuts the function off.
    maxDuration: 30,
};

type ScoreResumeRequest = {
    resume: ResumeContent;
    keywords: JdKeyword[];
};

/**
 * Turn the JSON body into the two values scoring needs.
 * Schema rules stay in the shared parsers (DIP); this function only
 * selects the fields this endpoint accepts (ISP).
 */
function parseScoreResumeRequest(body: unknown): ScoreResumeRequest {
    const record =
        body !== null && typeof body === "object" && !Array.isArray(body)
            ? (body as { resume?: unknown; keywords?: unknown })
            : {};

    return {
        resume: parseResumeContent(record.resume),
        keywords: parseKeywords(record.keywords),
    };
}

/**
 * Re-score a resume the caller already has.
 *
 * The handler authenticates, parses, and maps status codes (SRP).
 * Which scorer runs — Jev or the Mentioned fallback — stays inside
 * `scoreKeywords`, so a new scoring strategy does not change this route (OCP).
 * No credits: generation already paid, and one Jev call costs a fraction of a cent.
 * Response is `KeywordScoring` only, the slice re-analyze needs (ISP).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorBody | KeywordScoring>,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    try {
        const { resume, keywords } = parseScoreResumeRequest(req.body);
        const scoring = await scoreKeywords(keywords, resume);
        return res.status(200).json(scoring);
    } catch (error: unknown) {
        if (error instanceof InvalidResumeJsonError) {
            return res.status(400).json({ error: error.message });
        }

        console.error("Score resume error:", error);
        return res.status(500).json({ error: "An internal server error occurred." });
    }
}
