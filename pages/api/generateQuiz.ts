import type { NextApiRequest, NextApiResponse } from "next";
import { requireEntitlement, requireUser } from "@/lib/requireUser";
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
    prepareQuiz,
    QuizGenerationError,
    type GeneratedQuestion,
} from "@/lib/quiz";

type ResponseData = {
    quiz?: GeneratedQuestion[];
    error?: string;
    code?: string;
    remaining?: number;
    limit?: number;
    resetsAt?: string;
    characters?: number;
    max?: number;
}

interface GenerateRequest extends NextApiRequest {
    body: {
        title: string;
        topic: string;
        questionCount: Number;
    }
}

const quizAi = createOpenAiQuizClient();

export default async function handler(
    req: GenerateRequest,
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

    const { title, topic, questionCount } = req.body;

    console.log(`Generating Quiz -> Title: ${title} | Count: ${questionCount}`);

    let reservation: CreditReservation | undefined;

    try {
        const prepared = await prepareQuiz({
            title: title ?? "",
            source: { kind: "fromScratch", text: topic ?? "" },
            questionCount: Number(questionCount),
        });

        reservation = await consumeCredits(auth.user.id, {
            kind: "quiz",
            textParts: prepared.pricedText,
        });

        const quiz = await generateQuiz(prepared, { ai: quizAi });
        return res.status(200).json({ quiz });

    } catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        if (error instanceof QuizGenerationError) {
            // A refused topic keeps its credits, so gibberish can't be retried for free.
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
    }
}
