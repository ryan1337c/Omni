import { readFile } from "fs/promises";
import path from "path";

const BEGIN_DOCUMENT = "\\begin{document}";

export const PREAMBLE_RELATIVE_PATH = path.join("markdown", "preamble.md");
export const RESUME_STRUCT_RELATIVE_PATH = path.join("markdown", "resumeStruct.md");

export type ResumeTemplates = {
  /** documentclass, packages, and page setup from preamble.md */
  preamble: string;
  /** Jake macros (\resumeItem, \resumeSubheading, …) — everything before \begin{document} */
  macros: string;
};

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Load Jake resume templates from markdown files under `cwd`
 * (defaults to `process.cwd()` so the files stay the single source of truth).
 */
export async function loadResumeTemplates(
  cwd: string = process.cwd(),
): Promise<ResumeTemplates> {
  const [preambleRaw, structRaw] = await Promise.all([
    readFile(path.join(cwd, PREAMBLE_RELATIVE_PATH), "utf8"),
    readFile(path.join(cwd, RESUME_STRUCT_RELATIVE_PATH), "utf8"),
  ]);

  const preamble = stripBom(preambleRaw).trim();
  const resumeStruct = stripBom(structRaw);

  const beginIdx = resumeStruct.indexOf(BEGIN_DOCUMENT);
  if (beginIdx === -1) {
    throw new Error(
      `${RESUME_STRUCT_RELATIVE_PATH} is missing \\begin{document}`,
    );
  }

  // The sample resume after \begin{document} is reference material only; the body is generated
  // from JSON by resumeToLatexBody.
  const macros = resumeStruct.slice(0, beginIdx).trim();

  if (!preamble) {
    throw new Error(`${PREAMBLE_RELATIVE_PATH} is empty`);
  }
  if (!macros) {
    throw new Error(
      `${RESUME_STRUCT_RELATIVE_PATH} has no Jake macros before \\begin{document}`,
    );
  }

  return { preamble, macros };
}
