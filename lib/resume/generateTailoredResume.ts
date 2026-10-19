import Anthropic from "@anthropic-ai/sdk";
import {
  InvalidResumeJsonError,
  parseTailoredResponse,
} from "./parseResumeJson";
import type { TailoredResumeResponse } from "./schema";

export const TAILORED_RESUME_MODEL = "claude-sonnet-5-5";
export const TAILORED_RESUME_MAX_TOKENS = 8192;
export const TAILORED_RESUME_EFFORT = "medium" as const;

export type TailoredResumeInput = {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
};

export type GenerateTailoredResumeOptions = {
  client?: Anthropic;
  apiKey?: string;
};

// Structured outputs require every object to list all of its keys in `required`
// and set `additionalProperties: false`. Length caps are not expressible here,
// so `parseTailoredResponse` still enforces them after the call.
const stringField = { type: "string" } as const;
const bulletsField = { type: "array", items: stringField } as const;

function strictObject(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

/**
 * JSON schema mirroring `TailoredResumeResponse` in `schema.ts`. `sectionOrder` is left out:
 * the model doesn't choose it, and `parseResumeContent` fills in the default.
 */
export const TAILORED_RESUME_JSON_SCHEMA = strictObject({
  resume: strictObject({
    header: strictObject({
      name: stringField,
      phone: stringField,
      email: stringField,
      linkedin: stringField,
      github: stringField,
    }),
    summary: stringField,
    education: {
      type: "array",
      items: strictObject({
        institution: stringField,
        location: stringField,
        degree: stringField,
        dates: stringField,
        bullets: bulletsField,
      }),
    },
    experience: {
      type: "array",
      items: strictObject({
        title: stringField,
        company: stringField,
        location: stringField,
        dates: stringField,
        bullets: bulletsField,
      }),
    },
    projects: {
      type: "array",
      items: strictObject({
        name: stringField,
        technologies: stringField,
        dates: stringField,
        bullets: bulletsField,
      }),
    },
    skills: {
      type: "array",
      items: strictObject({
        category: stringField,
        items: stringField,
      }),
    },
    honors: {
      type: "array",
      items: strictObject({
        title: stringField,
        issuer: stringField,
        date: stringField,
        description: stringField,
      }),
    },
  }),
  keywords: {
    type: "array",
    items: strictObject({
      term: stringField,
      aliases: { type: "array", items: stringField },
      category: { type: "string", enum: ["hard", "soft", "other"] },
      importance: { type: "string", enum: ["required", "preferred"] },
    }),
  },
});

function requireApiKey(apiKey = process.env.ANTHROPIC_API_KEY): string {
  if (!apiKey) {
    throw new Error("Resume generation is not configured");
  }
  return apiKey;
}

export function buildTailoredResumeSystemPrompt(): string {
  return [
    "You are an expert resume writer. Tailor a source resume to a job description and return it as JSON matching the provided schema.",
    "",
    "## Output format",
    "- Plain text only in every field. No LaTeX, Markdown, or HTML, and do not escape special characters; the server handles escaping.",
    "- header: name, phone, email, linkedin, and github exactly as they appear in the source. Use an empty string for anything missing.",
    "- summary: fill this only if the source has a summary-like paragraph near the top, whether it is labeled Summary, Profile, Objective, About, or not labeled at all. A list of skills or a lone headline such as \"Software Engineer\" does not count. Otherwise use an empty string.",
    "- education: one entry per school, with the degree line (including minors) in `degree`. Details listed under the school (GPA, relevant coursework, honours, awards) go in `bullets`, one bullet per line in the source, not in `degree`. Use an empty array if the source has none.",
    "- experience: one entry per role. `title` is the job title and `company` is the employer.",
    "- projects: `technologies` is a comma-separated list of the tools used.",
    "- skills: one entry per category, with `items` as a comma-separated list.",
    "- honors: one entry per license, certification, or award in the source. `title` is the official title, `issuer` is the granting organization or institution, and `date` is the date or year received. Honors listed under a school stay in that school's education bullets and are not repeated here.",
    "- Write date ranges like \"Aug. 2018 -- May 2021\" or \"June 2020 -- Present\".",
    "- Use empty arrays for sections the source resume does not have.",
    "",
    "## Resume rules",
    "- Tailor experience and project bullets to the important keywords in the job description.",
    "- Format every experience and project bullet as: Action Verb + What You Built/Changed + Tech Stack/Tools + Quantifiable Impact.",
    "- Write the summary as one paragraph of 2 to 4 sentences following Who, What, Value: who the candidate is (role, experience, specialty), what they have done that matters for this job, and the value they would bring to this employer. You may expand a one-line source summary using facts found elsewhere in the source, but never invent any.",
    "- For each honor, set `description` to one short clause explaining why it was won or the scale of the competition, only when the source gives that context. Otherwise use an empty string. Never invent honors, issuers, or dates.",
    "- Do not invent jobs, employers, or degrees.",
    "- Do not add new categories in the skills section. Use only the categories provided in the source resume.",
    "- Only add skills in a category if it can be implied from the source resume.",
    "- Ensure the number of bullets in each experience and project entry matches the source resume.",
    "- Keep education bullets factual and with the same count as the source. Do not apply the bullet formula to them. You may reorder relevant coursework to put JD-related courses first, but never add courses, awards, or a GPA that are not in the source.",
    "- Prefer JD-aligned language over preserving original phrasing. But do not litter every phrase with keywords, only add them if it is implied from the source resume.",
    "- Do not change the order of projects.",
    "- Preserve real dates and locations from the source.",
    "- Prefer each experience and project bullet to be one line (roughly 100 characters). Use a second line only if one line cannot cover the work adequately. However, if the resulting second line is only a single word or a short hanging phrase that covers less than 1/4 of the line length (a widow), shorten the bullet so it fits on one line.",
    "- Prefer a single page.",
    "",
    "## Keyword rules",
    "- Extract keywords from the JOB DESCRIPTION only, never from the source resume. They are used to score how well the tailored resume matches the job.",
    "- category \"hard\": roughly 8-12 hard skills (tools, languages, platforms, methods), e.g. \"Google Analytics\", \"SQL\", \"A/B testing\".",
    "- category \"soft\": roughly 5-8 soft skills, e.g. \"Stakeholder management\", \"Cross-functional collaboration\".",
    "- category \"other\": roughly 3-6 other requirements such as certifications, degrees, or spoken languages. Return fewer if the job description has fewer.",
    "- term: a short display label of 1-4 words in the job description's wording.",
    "- aliases: alternate spellings, abbreviations, or close synonyms that should also count as a match, e.g. [\"GA4\"] for \"Google Analytics\". Use an empty array if there are none.",
    "- importance: \"required\" if the job description lists it as required or essential, otherwise \"preferred\".",
    "- Do not repeat the same keyword across categories.",
  ].join("\n");
}

export function buildTailoredResumeUserPrompt(
  input: TailoredResumeInput,
): string {
  const jobTitle = input.jobTitle?.trim() || "(not provided)";
  return [
    "JOB TITLE:",
    `"""${jobTitle}"""`,
    "",
    "JOB DESCRIPTION:",
    `"""${input.jobDescription}"""`,
    "",
    "SOURCE RESUME TEXT:",
    `"""${input.resumeText}"""`,
  ].join("\n");
}

function extractTextContent(message: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("").trim();
}

/**
 * One Claude Sonnet 5 call that returns the tailored resume and the job
 * description keywords as structured JSON. Does not send temperature / top_p / top_k.
 * Throws `InvalidResumeJsonError` if the output is truncated, refused, or malformed.
 */
export async function generateTailoredResume(
  input: TailoredResumeInput,
  options: GenerateTailoredResumeOptions = {},
): Promise<TailoredResumeResponse> {
  const client =
    options.client ??
    new Anthropic({ apiKey: requireApiKey(options.apiKey) });

  const message = await client.messages.create({
    model: TAILORED_RESUME_MODEL,
    max_tokens: TAILORED_RESUME_MAX_TOKENS,
    output_config: {
      effort: TAILORED_RESUME_EFFORT,
      format: { type: "json_schema", schema: TAILORED_RESUME_JSON_SCHEMA },
    },
    system: buildTailoredResumeSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildTailoredResumeUserPrompt(input),
      },
    ],
  });

  // Structured outputs only guarantee the schema when the model finishes normally.
  if (message.stop_reason === "max_tokens") {
    throw new InvalidResumeJsonError("Model output was cut off before finishing");
  }
  if (message.stop_reason === "refusal") {
    throw new InvalidResumeJsonError("Model declined to generate the resume");
  }

  const text = extractTextContent(message);
  if (!text) {
    throw new InvalidResumeJsonError("Model output is empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidResumeJsonError("Model output is not valid JSON");
  }
  return parseTailoredResponse(parsed);
}
