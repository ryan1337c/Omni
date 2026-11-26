import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { requireUser } from "@/lib/requireUser";
import { MAX_IMAGE_PROMPT_LENGTH, lengthError } from "@/lib/inputLimits";
import {
    consumeCredits,
    refundCreditsQuietly,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";

type ResponseData = {
    url?: string;
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
        prompt: string;
        n: number;
        size: string;
    }
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

    const promptString = req.body.prompt;
    if (!promptString) {
      return res.status(400).json({ error: "You need a prompt" });
    }
    if (typeof promptString === "string" && promptString.length > MAX_IMAGE_PROMPT_LENGTH) {
      return res.status(400).json({ error: lengthError("Image prompt", MAX_IMAGE_PROMPT_LENGTH) });
    }

    let reservation: CreditReservation | undefined;

    try{
        reservation = await consumeCredits(auth.user.id, { kind: "image" });

        // Casting response as 'any' to pass the exact payload without SDK auto-format injections
        const aiResponse = await openai.images.generate({
            prompt: promptString,
            n:1,
            size:"1024x1024",
            model: "gpt-image-2",
        } as any);

        if (!aiResponse.data || aiResponse.data.length === 0) {
            await refundCreditsQuietly(reservation);
            return res.status(500).json({ error: "No images generated" });
        }

        let base64Image = aiResponse.data[0].b64_json;

        if (!base64Image) {
            await refundCreditsQuietly(reservation);
            return res.status(500).json({ error: "Invalid or missing image data from OpenAI" });
        }

        // Return the base64 image as a data URL
        return res.status(200).json({ url: `data:image/png;base64,${base64Image}` });
    }
    catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        await refundCreditsQuietly(reservation);

        console.error("OpenAI API Error:", error);
        
        const statusCode = error.status || 500;
        const message = error.error?.message || error.message || "An unexpected error occurred";
        
        return res.status(statusCode).json({ error: message });
    }
}