import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { errors as formidableErrors } from "formidable";
import fs from "fs/promises";
import { requireEntitlement, requireUser } from "@/lib/requireUser";
import { MAX_TITLE_LENGTH } from "@/app/components/flashcards-view/constants";
import {
    consumeCredits,
    refundCreditsQuietly,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";
import {
    createOpenAiDeckClient,
    DeckGenerationError,
    generateDeck,
    isGenerationSourceKind,
    prepareDeck,
    type Card,
    type GenerationSourceInput,
} from "@/lib/flashcards";
import {
    QuizGenerationError,
    resolveDocumentMimeType,
    MAX_DOCUMENT_BYTES,
    type QuizDocument,
} from "@/lib/quiz";

type ResponseData = {
    cards?: Card[];
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

const deckAi = createOpenAiDeckClient();

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
        throw new DeckGenerationError("invalid_input", `Unknown Generation Source "${source}"`);
    }
    switch (source) {
        case "fromScratch":
            return { kind: "fromScratch", text };
        case "notes":
            return { kind: "notes", document: await toDocument(file), focus: text };
    }
}

async function toDocument(file: formidable.File | undefined): Promise<QuizDocument> {
    if (!file) {
        throw new QuizGenerationError("missing_file");
    }
    return {
        bytes: await fs.readFile(file.filepath),
        mimeType: resolveDocumentMimeType(file.mimetype, file.originalFilename),
    };
}

function reportedGenerationError(error: unknown) {
    if (error instanceof DeckGenerationError || error instanceof QuizGenerationError) {
        return error;
    }
    return undefined;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
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
    let uploadedFile: formidable.File | undefined;

    try {
        const { fields, files } = await parseForm(req);
        uploadedFile = files.file?.[0];
        const title = (fields.title?.[0] ?? "").trim();
        if (!title || title.length > MAX_TITLE_LENGTH) {
          return res
            .status(400)
            .json({ error: `Deck title must be 1–${MAX_TITLE_LENGTH} characters.` });
        }
        const source = fields.source?.[0];
        const cardCount = Number(fields.cardCount?.[0]);

        const prepared = await prepareDeck({
            title,
            source: await toGenerationSourceInput(source, fields.text?.[0] ?? "", uploadedFile),
            cardCount,
        });

        reservation = await consumeCredits(auth.user.id, {
            kind: "flashcards",
            textParts: prepared.pricedText,
        });

        const cards = await generateDeck(prepared, { ai: deckAi });
        return res.status(200).json({ cards });
    } catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        const generationError = reportedGenerationError(error);
        if (generationError) {
            // A refused topic keeps its credits, so gibberish can't be retried for free.
            if (generationError.kind !== "invalid_input") {
                await refundCreditsQuietly(reservation);
            }
            console.error("Deck generation rejected:", generationError.kind, generationError.message);
            return res.status(generationError.status).json(generationError.toResponseBody());
        }

        await refundCreditsQuietly(reservation);

        console.error("Error generating deck:", error);
        return res.status(500).json({
            error: error.message || "Failed to generate flashcard deck",
        });
    } finally {
        if (uploadedFile) {
            await fs.rm(uploadedFile.filepath, { force: true }).catch(() => {});
        }
    }
}
