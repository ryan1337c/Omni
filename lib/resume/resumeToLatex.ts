import { InvalidResumeJsonError } from "./parseResumeJson";
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeContent,
  ResumeHeader,
  SkillEntry,
} from "./schema";

const LATEX_SPECIALS: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "#": "\\#",
  _: "\\_",
  $: "\\$",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
  // The preamble uses OT1 (no T1 fontenc), where these glyphs render as ¡ ¿ and an em dash.
  "<": "\\textless{}",
  ">": "\\textgreater{}",
  "|": "\\textbar{}",
};

const LATEX_SPECIALS_RE = /[\\&%#_${}~^<>|]/g;

// pdflatex's utf8 inputenc errors on characters it has no definition for.
const UNICODE_REPLACEMENTS: Record<string, string> = {
  "\u00a0": " ",
  "\u2192": "->",
  "\u2190": "<-",
  "\u2194": "<->",
  "\u21d2": "=>",
  "\u2212": "-",
  "\u2010": "-",
  "\u2011": "-",
  "\u2264": "<=",
  "\u2265": ">=",
  "\u00d7": "x",
  "\u2248": "~",
  "\u2605": "*",
  "\u2713": "",
  "\u2714": "",
};

const UNICODE_REPLACEMENTS_RE = new RegExp(
  `[${Object.keys(UNICODE_REPLACEMENTS).join("")}]`,
  "g",
);

// Control chars, zero-width/bidi marks, variation selectors, private use, and astral-plane symbols (emoji).
const UNSUPPORTED_CHARS_RE =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufe00-\ufe0f\ue000-\uf8ff\ufeff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;

function cleanText(value: string): string {
  return value
    .normalize("NFC")
    .replace(UNICODE_REPLACEMENTS_RE, (ch) => UNICODE_REPLACEMENTS[ch])
    .replace(UNSUPPORTED_CHARS_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escape plain text for use inside a LaTeX argument. Newlines collapse to spaces. */
export function escapeLatex(value: string): string {
  return cleanText(value).replace(
    LATEX_SPECIALS_RE,
    (ch) => LATEX_SPECIALS[ch],
  );
}

/** Make a URL safe for the first argument of a top-level `\href`. */
function escapeHrefUrl(url: string): string {
  return cleanText(url)
    .replace(/[\s\\{}"<>^`|]/g, "")
    .replace(/[%#]/g, (ch) => `\\${ch}`);
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

type ProfileLink = { href: string; display: string };

function profileLink(
  raw: string,
  bareHandlePrefix: string,
): ProfileLink | null {
  let value = cleanText(raw).replace(/^@/, "");
  if (!value) {
    return null;
  }
  if (!SCHEME_RE.test(value) && !/[./]/.test(value)) {
    value = `${bareHandlePrefix}${value}`;
  }
  const href = SCHEME_RE.test(value) ? value : `https://${value}`;
  const display = value
    .replace(SCHEME_RE, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
  return { href, display };
}

function hrefUnderlined(href: string, display: string): string {
  return `\\href{${escapeHrefUrl(href)}}{\\underline{${escapeLatex(display)}}}`;
}

function hasText(...values: string[]): boolean {
  return values.some((value) => cleanText(value).length > 0);
}

function nonEmptyBullets(bullets: string[]): string[] {
  return bullets.filter((bullet) => hasText(bullet));
}

function renderBullets(bullets: string[], indent: string): string[] {
  const items = nonEmptyBullets(bullets);
  if (items.length === 0) {
    return [];
  }
  return [
    `${indent}\\resumeItemListStart`,
    ...items.map((bullet) => `${indent}  \\resumeItem{${escapeLatex(bullet)}}`),
    `${indent}\\resumeItemListEnd`,
  ];
}

function renderHeader(header: ResumeHeader): string[] {
  const contact: string[] = [];

  const phone = escapeLatex(header.phone);
  if (phone) {
    contact.push(phone);
  }

  const email = cleanText(header.email).replace(/^mailto:/i, "");
  if (email) {
    contact.push(hrefUnderlined(`mailto:${email}`, email));
  }

  const linkedin = profileLink(header.linkedin, "linkedin.com/in/");
  if (linkedin) {
    contact.push(hrefUnderlined(linkedin.href, linkedin.display));
  }

  const github = profileLink(header.github, "github.com/");
  if (github) {
    contact.push(hrefUnderlined(github.href, github.display));
  }

  const name = escapeLatex(header.name);
  if (!name && contact.length === 0) {
    return [];
  }

  const lines = ["\\begin{center}"];
  if (name) {
    lines.push(`\\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}`);
  }
  if (contact.length > 0) {
    lines.push(`\\small ${contact.join(" $|$\n")}`);
  }
  lines.push("\\end{center}");
  return lines;
}

function renderSection(title: string, entries: string[][]): string[] {
  if (entries.length === 0) {
    return [];
  }
  return [
    `\\section{${title}}`,
    "\\resumeSubHeadingListStart",
    ...entries.flat(),
    "\\resumeSubHeadingListEnd",
  ];
}

function renderEducation(entry: EducationEntry): string[] {
  return [
    "  \\resumeSubheading",
    `    {${escapeLatex(entry.institution)}}{${escapeLatex(entry.location)}}`,
    `    {${escapeLatex(entry.degree)}}{${escapeLatex(entry.dates)}}`,
    ...renderBullets(entry.bullets, "    "),
  ];
}

function renderExperience(entry: ExperienceEntry): string[] {
  return [
    "  \\resumeSubheading",
    `    {${escapeLatex(entry.title)}}{${escapeLatex(entry.dates)}}`,
    `    {${escapeLatex(entry.company)}}{${escapeLatex(entry.location)}}`,
    ...renderBullets(entry.bullets, "    "),
  ];
}

function renderProject(entry: ProjectEntry): string[] {
  const name = escapeLatex(entry.name);
  const technologies = escapeLatex(entry.technologies);
  const parts: string[] = [];
  if (name) {
    parts.push(`\\textbf{${name}}`);
  }
  if (technologies) {
    parts.push(`\\emph{${technologies}}`);
  }
  return [
    "  \\resumeProjectHeading",
    `    {${parts.join(" $|$ ")}}{${escapeLatex(entry.dates)}}`,
    ...renderBullets(entry.bullets, "    "),
  ];
}

function renderSkills(skills: SkillEntry[]): string[] {
  const lines = skills
    .map((skill) => {
      const category = escapeLatex(skill.category);
      const items = escapeLatex(skill.items);
      if (category && items) {
        return `\\textbf{${category}}{: ${items}}`;
      }
      return category ? `\\textbf{${category}}` : items;
    })
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }
  return [
    "\\section{Technical Skills}",
    "\\begin{itemize}[leftmargin=0.15in, label={}]",
    "\\small{\\item{",
    lines.join(" \\\\\n"),
    "}}",
    "\\end{itemize}",
  ];
}

/**
 * Build the Jake `\begin{document}...\end{document}` body from resume JSON.
 * Pair with `assembleTex` and the template preamble/macros. Empty sections are skipped.
 */
export function resumeToLatexBody(content: ResumeContent): string {
  const education = content.education
    .filter(
      (e) =>
        hasText(e.institution, e.location, e.degree, e.dates) ||
        nonEmptyBullets(e.bullets).length > 0,
    )
    .map(renderEducation);

  const experience = content.experience
    .filter(
      (e) =>
        hasText(e.title, e.company, e.location, e.dates) ||
        nonEmptyBullets(e.bullets).length > 0,
    )
    .map(renderExperience);

  const projects = content.projects
    .filter(
      (p) =>
        hasText(p.name, p.technologies, p.dates) ||
        nonEmptyBullets(p.bullets).length > 0,
    )
    .map(renderProject);

  const blocks = [
    renderHeader(content.header),
    renderSection("Education", education),
    renderSection("Experience", experience),
    renderSection("Projects", projects),
    renderSkills(content.skills),
  ].filter((block) => block.length > 0);

  // pdflatex produces no PDF for an empty document.
  if (blocks.length === 0) {
    throw new InvalidResumeJsonError("Resume has no content to render");
  }

  return [
    "\\begin{document}",
    "",
    blocks.map((block) => block.join("\n")).join("\n\n"),
    "",
    "\\end{document}",
  ].join("\n");
}
