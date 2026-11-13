import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { errors as formidableErrors } from "formidable";
import fs from "fs/promises";
import { requireEntitlement, requireUser } from "@/lib/requireUser";
import { supabaseServerClient } from "@/lib/supaBaseServer";
import {
    consumeCredits,
    refundCreditsQuietly,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";
import {
    createOpenAiQuizClient,
    generateQuiz,
    isGenerationSourceKind,
    newFigurePath,
    prepareQuiz,
    resolveDocumentMimeType,
    FIGURE_BUCKET,
    MAX_DOCUMENT_BYTES,
    QuizGenerationError,
    type GeneratedQuestion,
    type GenerationSourceInput,
    type QuizDocument,
} from "@/lib/quiz";
import { MAX_TITLE_LENGTH } from "@/app/components/flashcards-view/constants";

/** A generated question whose Figures are already in storage. */
type QuestionWithStoredFigures = Omit<GeneratedQuestion, "figures"> & { figure_paths: string[] };

type ResponseData = {
    quiz?: QuestionWithStoredFigures[];
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
    // Reading a long document can push generation past the default Vercel Hobby timeout.
    maxDuration: 60,
};

const quizAi = createOpenAiQuizClient();

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({
            maxFiles: 1,
            maxFileSize: MAX_DOCUMENT_BYTES,
            maxTotalFileSize: MAX_DOCUMENT_BYTES,
            allowEmptyFiles: true,
        });
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(toUploadError(err));
            } else {
                resolve({ fields, files });
            }
        });
    });
};

// @types/formidable lacks `biggerThanTotalMaxFileSize`, which formidable 3 raises before the per-file check.
const FILE_TOO_LARGE_CODES = [
    formidableErrors.biggerThanMaxFileSize,
    (formidableErrors as unknown as Record<string, number>).biggerThanTotalMaxFileSize,
];

function toUploadError(err: any) {
    return FILE_TOO_LARGE_CODES.includes(err?.code)
        ? new QuizGenerationError("file_too_large", err.message)
        : err;
}

async function toGenerationSourceInput(
    source: string | undefined,
    text: string,
    file: formidable.File | undefined,
): Promise<GenerationSourceInput> {
    if (!isGenerationSourceKind(source)) {
        throw new QuizGenerationError("invalid_input", `Unknown Generation Source "${source}"`);
    }
    switch (source) {
        case "fromScratch":
            return { kind: "fromScratch", text };
        case "notes":
            return { kind: "notes", document: await toQuizDocument(file), focus: text };
        case "sampleTest":
            return { kind: "sampleTest", document: await toQuizDocument(file) };
    }
}

async function toQuizDocument(file: formidable.File | undefined): Promise<QuizDocument> {
    if (!file) {
        throw new QuizGenerationError("missing_file");
    }
    return {
        bytes: await fs.readFile(file.filepath),
        mimeType: resolveDocumentMimeType(file.mimetype, file.originalFilename),
    };
}

/**
 * Uploads each question's own copy of its Figures, so Parts that share a picture
 * don't share a file. On any failure, removes what was uploaded and throws.
 */
async function storeFigures(questions: GeneratedQuestion[], userId: string): Promise<QuestionWithStoredFigures[]> {
    const uploads = questions.flatMap((question, questionIndex) =>
        question.figures.map(async (figure) => {
            const path = newFigurePath(userId, figure.mimeType);
            const { error } = await supabaseServerClient.storage
                .from(FIGURE_BUCKET)
                .upload(path, figure.bytes, { contentType: figure.mimeType });
            if (error) {
                throw error;
            }
            return { questionIndex, path };
        }),
    );
    const results = await Promise.allSettled(uploads);
    const stored = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failed = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failed) {
        if (stored.length > 0) {
            await supabaseServerClient.storage
                .from(FIGURE_BUCKET)
                .remove(stored.map(({ path }) => path))
                .catch(() => {});
        }
        throw failed.reason;
    }

    return questions.map(({ figures: _figures, ...question }, questionIndex) => ({
        ...question,
        figure_paths: stored
            .filter((upload) => upload.questionIndex === questionIndex)
            .map(({ path }) => path),
    }));
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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
    let uploadedFile: formidable.File | undefined;

    try {
        const { fields, files } = await parseForm(req);
        uploadedFile = files.file?.[0];
        const title = (fields.title?.[0] ?? "").trim();
        if (!title || title.length > MAX_TITLE_LENGTH) {
          return res
            .status(400)
            .json({ error: `Quiz title must be 1–${MAX_TITLE_LENGTH} characters.` });
        }
        const source = fields.source?.[0];
        const questionCount = Number(fields.questionCount?.[0]);

        console.log(`Generating Quiz -> Title: ${title} | Source: ${source} | Count: ${questionCount}`);

        const prepared = await prepareQuiz({
            title,
            source: await toGenerationSourceInput(source, fields.text?.[0] ?? "", uploadedFile),
            questionCount,
        });

        reservation = await consumeCredits(auth.user.id, {
            kind: "quiz",
            textParts: prepared.pricedText,
        });

        const questions = await generateQuiz(prepared, { ai: quizAi });
        const quiz = await storeFigures(questions, auth.user.id);
        return res.status(200).json({ quiz });

    } catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        if (error instanceof QuizGenerationError) {
            // A refused topic keeps its credits, so gibberish can't be retried for free.
            // Every other kind, including a Sample Test with no or too many questions, is refunded.
            if (error.kind !== "invalid_input") {
                await refundCreditsQuietly(reservation);
            }
            console.error("Quiz generation rejected:", error.kind, error.message);
            return res.status(error.status).json(error.toResponseBody());
        }

        await refundCreditsQuietly(reservation);

        console.error("Error generating quiz:", error);
        return res.status(500).json({ 
            error: error.message || "Failed to generate quiz" 
        });
    } finally {
        if (uploadedFile) {
            await fs.rm(uploadedFile.filepath, { force: true }).catch(() => {});
        }
    }
}
