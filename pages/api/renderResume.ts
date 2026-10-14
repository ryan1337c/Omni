import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/requireUser";
import {
    assembleTex,
    compileLatex,
    InvalidResumeJsonError,
    LatexCompileError,
    loadResumeTemplates,
    parseResumeContent,
    resumeToLatexBody,
} from "@/lib/resume";

type ResponseData = {
    error?: string;
};

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "256kb",
        },
    },
    // Remote LaTeX compilation can exceed the default Vercel Hobby timeout.
    maxDuration: 60,
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Buffer>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    try {
        const body = req.body as { resume?: unknown } | undefined;
        const resume = parseResumeContent(body?.resume);

        const templates = await loadResumeTemplates();
        const texSource = assembleTex({
            preamble: templates.preamble,
            macros: templates.macros,
            documentBody: resumeToLatexBody(resume),
        });
        const pdfBytes = await compileLatex(texSource);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="Tailored_Resume.pdf"');
        res.setHeader("Cache-Control", "no-store");

        return res.status(200).send(pdfBytes);
    } catch (error: any) {
        if (error instanceof InvalidResumeJsonError) {
            return res.status(400).json({ error: error.message });
        }

        console.error("Render resume error:", error);

        const message =
            error instanceof LatexCompileError
                ? error.message
                : "An internal server error occurred.";

        return res.status(500).json({ error: message });
    }
}
