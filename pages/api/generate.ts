import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import formidable, { errors as formidableErrors } from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { getEffectiveTier, requireUser } from "@/lib/requireUser";
import {
    InputLimitError,
    MAX_CHAT_FIELDS_SIZE,
    MAX_CHAT_FILE_BYTES,
    MAX_CHAT_FILES,
    MAX_CHAT_TOTAL_FILE_BYTES,
    assertChatAttachments,
    CHAT_FILE_TOO_LARGE_MESSAGE,
    CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE,
    TOO_MANY_CHAT_FILES_MESSAGE,
} from "@/lib/inputLimits";
import {
    consumeCredits,
    extractChatTextParts,
    getContextWindow,
    refundCreditsQuietly,
    slideToWindow,
    splitCurrentTurn,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";

type ResponseData = {
    response?: string;
    error?: string;
    code?: string;
    remaining?: number;
    limit?: number;
    resetsAt?: string;
    characters?: number;
    max?: number;
};

export const config = {
    api: {
        bodyParser: false, // Disable for file uploads
    },
};

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1"
});

const deepseekClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
});

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({
            multiples: true,
            maxFiles: MAX_CHAT_FILES,
            maxFileSize: MAX_CHAT_FILE_BYTES,
            maxTotalFileSize: MAX_CHAT_TOTAL_FILE_BYTES,
            maxFieldsSize: MAX_CHAT_FIELDS_SIZE,
        });
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(toChatUploadError(err));
            } else {
                resolve({ fields, files });
            }
        });
    });
};

const FILE_TOO_LARGE_CODES = [
    formidableErrors.biggerThanMaxFileSize,
    (formidableErrors as unknown as Record<string, number>).biggerThanTotalMaxFileSize,
    formidableErrors.maxFieldsSizeExceeded,
];

function toChatUploadError(err: any) {
    const code = err?.code;
    if (code === formidableErrors.biggerThanMaxFileSize) {
        return new InputLimitError(CHAT_FILE_TOO_LARGE_MESSAGE, 413);
    }
    if (
        code ===
        (formidableErrors as unknown as Record<string, number>).biggerThanTotalMaxFileSize
    ) {
        return new InputLimitError(CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE, 413);
    }
    if (code === (formidableErrors as unknown as Record<string, number>).maxFilesExceeded) {
        return new InputLimitError(TOO_MANY_CHAT_FILES_MESSAGE, 413);
    }
    if (FILE_TOO_LARGE_CODES.includes(code)) {
        return new InputLimitError(CHAT_FILES_TOTAL_TOO_LARGE_MESSAGE, 413);
    }
    return err;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    let reservation: CreditReservation | undefined;

    try {
        // Parse form data (works for both with/without files)
        const { fields, files } = await parseForm(req);

        const modelId = fields.modelId?.[0];
        const historyStr = fields.history?.[0];

        if (!modelId) {
            return res.status(400).json({ error: "Missing required field: modelId." });
        }

        // Parse history
        let history: Array<any> = [];
        if (historyStr) {
            try {
                history = JSON.parse(historyStr);
            } catch (e) {
                return res.status(400).json({ error: "Invalid history format." });
            }
        }

        // Select client and model
        let activeClient: OpenAI;
        let modelToUse: string;

        if (modelId.includes('deep-seek')) {
            if (!process.env.DEEPSEEK_API_KEY) {
                throw new Error("DeepSeek API key not configured.");
            }
            activeClient = deepseekClient;
            modelToUse = "deepseek-v4-flash";
        } else {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error("OpenAI API key not configured.");
            }
            activeClient = openaiClient;
            modelToUse = modelId === "gpt-4o" || modelId === "claude-sonnet-4" 
                ? "gpt-4o-mini" 
                : "gpt-4o-mini";
        }

        // Check if there are uploaded files
        const uploadedFiles = files.files as formidable.File[] | formidable.File | undefined;
        const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : uploadedFiles ? [uploadedFiles] : [];
        if (fileArray.length > 0) {
            assertChatAttachments(
                fileArray.map((file) => ({
                    name: file.originalFilename ?? undefined,
                    originalFilename: file.originalFilename,
                    mimetype: file.mimetype,
                    size: file.size,
                })),
            );
        }

        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        if (fileArray.length > 0) {
            // WITH FILES: Build messages with file content
            const userInput = fields.userInput?.[0] || "";
            
            const userMessageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
                { type: "text", text: userInput },
            ];

            for (const file of fileArray) {
                if (file.mimetype?.startsWith("image/")) {
                    const fileBuffer = fs.readFileSync(file.filepath);
                    const base64Image = fileBuffer.toString('base64');
                    const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
                    userMessageContent.push({
                        type: "image_url",
                        image_url: { url: dataUrl },
                    });
                } else if (file.mimetype === "application/pdf") {
                    const pdfBuffer = fs.readFileSync(file.filepath);
                    const pdfData = await pdf(pdfBuffer);
                    const combinedText = `\n\n--- PDF File: ${file.originalFilename} ---\n${pdfData.text}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                } else {
                    const fileContent = fs.readFileSync(file.filepath, "utf8");
                    const combinedText = `\n\n--- File: ${file.originalFilename} ---\n${fileContent}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                }
            }

            // Combine history with the new user message containing files.
            // History already includes the typed user turn; splitCurrentTurn
            // drops that duplicate so file text is priced once with this turn.
            messages = [
                ...history,
                {
                    role: "user",
                    content: userMessageContent,
                }
            ];
        } else {
                // WITHOUT FILES: Use history directly
                if (!history || history.length === 0) {
                    return res.status(400).json({ error: "Missing history or files." });
                }
                messages = history;
            }

        const tier = await getEffectiveTier(auth.user.id);
        const windowChars = getContextWindow(tier);
        const { prior, current } = splitCurrentTurn(messages);
        const windowed = slideToWindow(prior, current, windowChars);

        reservation = await consumeCredits(auth.user.id, {
            kind: "chat",
            textParts: extractChatTextParts([current]),
        });
        
        // Make API call
        const chatCompletion = await activeClient.chat.completions.create({
            model: modelToUse,
            messages: windowed,
        });

        const response = chatCompletion.choices[0].message.content;
        const cleanText = response?.replace(/[\u2B00-\u2BFF]/g, '');
        
        return res.status(200).json({ response: cleanText ?? "" });

    }
    catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        if (error instanceof InputLimitError) {
            return res.status(error.status).json({ error: error.message });
        }

        await refundCreditsQuietly(reservation);

        console.error("API Error:", error);
        
        if (error.status === 400) {
            return res.status(400).json({ error: "Bad Request" });
        }
        
        return res.status(error.status || 500).json({ 
            error: error.message || "An internal server error occurred." 
        });
    }
}
