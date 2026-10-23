import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import pdf from "pdf-parse";
import { requireEntitlement, requireUser } from "@/lib/requireUser";
import {
    consumeCredits,
    refundCreditsQuietly,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";
import {
    generateTailoredResume,
    InvalidResumeJsonError,
    scoreKeywords,
    type TailoredResumeResult,
} from "@/lib/resume";

type ResponseData = {
    error?: string;
    code?: string;
    remaining?: number;
    limit?: number;
    resetsAt?: string;
    characters?: number;
    max?: number;
}

export const config = {
    api: {
        bodyParser: false,
    },
    // A full Sonnet tailoring call can exceed the default Vercel Hobby timeout.
    maxDuration: 60,
};

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | TailoredResumeResult>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    const entitlement = await requireEntitlement(auth.user.id);
    if (!entitlement.ok) {
        return res.status(entitlement.status).json({ error: entitlement.error });
    }

    let reservation: CreditReservation | undefined;

    try {
        const { fields, files } = await parseForm(req);

        const resumeFile = (files.resumeFile as formidable.File[])?.[0];
        const jobDescription = (fields.jobDescription as string[])?.[0];
        const jobTitle = (fields.jobTitle as string[])?.[0];

        if (!resumeFile || !jobDescription) {
            return res.status(400).json({ error: "Missing required fields: resume file, job description, or job title." });
        }

        const fileBuffer = await fs.readFile(resumeFile.filepath);
        const pdfData = await pdf(fileBuffer);
        const resumeText = pdfData.text;

        reservation = await consumeCredits(auth.user.id, {
            kind: "resume",
            textParts: [resumeText, jobDescription, jobTitle ?? ""],
        });

        // Return editable JSON; the PDF is compiled later by /api/renderResume on download.
        const tailored = await generateTailoredResume({
            resumeText,
            jobDescription,
            jobTitle,
        });

        // Scoring is its own step (SRP): this handler only attaches the result.
        // Credits are already spent, and `scoreKeywords` falls back to literal
        // matching when Jev is unavailable, so the paid resume is always delivered.
        const scoring = await scoreKeywords(tailored.keywords, tailored.resume);

        return res.status(200).json({ ...tailored, scoring });
    } catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        await refundCreditsQuietly(reservation);

        console.error("API Error:", error);

        const message =
            error instanceof InvalidResumeJsonError
                ? "Failed to generate a valid resume. Please try again."
                : error.message || "An internal server error occurred.";

        res.status(500).json({ error: message });
    }
}
