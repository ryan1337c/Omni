import Anthropic from "@anthropic-ai/sdk";
import type { ResumeTemplates } from "./loadTemplates";
import { InvalidResumeLatexError } from "./normalizeModelLatex";

export const JAKE_RESUME_MODEL = "claude-sonnet-5";
export const JAKE_RESUME_MAX_TOKENS = 8192;
export const JAKE_RESUME_EFFORT = "medium" as const;

export type JakeResumeInput = {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
};

export type GenerateJakeResumeOptions = {
  client?: Anthropic;
  apiKey?: string;
};

function requireApiKey(apiKey = process.env.ANTHROPIC_API_KEY): string {
  if (!apiKey) {
    throw new Error("Resume generation is not configured");
  }
  return apiKey;
}

export function buildJakeResumeSystemPrompt(
  templates: Pick<ResumeTemplates, "macros" | "exampleBody">,
): string {
  return [
    "You are an expert resume writer. Convert a source resume into Jake's Resume LaTeX.",
    "",
    "Emit ONLY a LaTeX document body from \\begin{document} through \\end{document}.",
    "Do not include a preamble, \\documentclass, \\usepackage, \\newcommand, or markdown fences.",
    "The server prepends the documentclass, packages, and the Jake macros below.",
    "",
    "Use only these macros for structure: \\resumeItem, \\resumeSubheading, \\resumeSubSubheading, \\resumeProjectHeading, \\resumeSubHeadingListStart, \\resumeSubHeadingListEnd, \\resumeItemListStart, \\resumeItemListEnd.",
    "",
    "## Macro definitions",
    templates.macros.trim(),
    "",
    "## Example body (format and layout only — do not copy its names, jobs, or wording)",
    templates.exampleBody.trim(),
    "",
    "Rules:",
    "- Tailor experience and project bullets to the important keywords in the job description.",
    "- Do not invent jobs, employers, or degrees.",
    "- Do not add new categories in the Skills section or make up new skills that cannot be inferred from the source resume.",
    "- If projects contains a timeline of development, order projects from most recent to oldest. If a project has no dates, add it to the end of the list.",
    "- Ensure the number of points in experience and projects matches the source resume.",
    "- Prefer JD-aligned language over preserving original phrasing. But do not change the meaning of the source resume too much.",
    "- Preserve real dates and locations from the source.",
    "- Escape LaTeX special characters in user content: &, %, #, _, $, {, }, ~, ^.",
    "- Omit empty sections (no Projects section if the source has none).",
    "- Prefer a single page.",
  ].join("\n");
}

export function buildJakeResumeUserPrompt(input: JakeResumeInput): string {
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
  return parts.join("\n").trim();
}

/**
 * One Claude Sonnet 5 call that emits `\begin{document}...\end{document}`
 * using Jake resume macros. Does not send temperature / top_p / top_k.
 */
export async function generateJakeResumeBody(
  templates: Pick<ResumeTemplates, "macros" | "exampleBody">,
  input: JakeResumeInput,
  options: GenerateJakeResumeOptions = {},
): Promise<string> {
  const client =
    options.client ??
    new Anthropic({ apiKey: requireApiKey(options.apiKey) });

  const message = await client.messages.create({
    model: JAKE_RESUME_MODEL,
    max_tokens: JAKE_RESUME_MAX_TOKENS,
    output_config: { effort: JAKE_RESUME_EFFORT },
    system: buildJakeResumeSystemPrompt(templates),
    messages: [
      {
        role: "user",
        content: buildJakeResumeUserPrompt(input),
      },
    ],
  });

  const text = extractTextContent(message);
  if (!text) {
    throw new InvalidResumeLatexError("Model output is empty");
  }
  return text;
}
