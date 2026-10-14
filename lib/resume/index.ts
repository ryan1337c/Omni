export {
  loadResumeTemplates,
  PREAMBLE_RELATIVE_PATH,
  RESUME_STRUCT_RELATIVE_PATH,
  type ResumeTemplates,
} from "./loadTemplates";
export { assembleTex, type AssembleTexParts } from "./assembleTex";
export {
  InvalidResumeJsonError,
  parseResumeContent,
  parseTailoredResponse,
} from "./parseResumeJson";
export type {
  EducationEntry,
  ExperienceEntry,
  JdKeyword,
  KeywordCategory,
  ProjectEntry,
  ResumeContent,
  ResumeHeader,
  SkillEntry,
  TailoredResumeResponse,
} from "./schema";
export {
  generateTailoredResume,
  buildTailoredResumeSystemPrompt,
  buildTailoredResumeUserPrompt,
  TAILORED_RESUME_JSON_SCHEMA,
  TAILORED_RESUME_MODEL,
  TAILORED_RESUME_MAX_TOKENS,
  TAILORED_RESUME_EFFORT,
  type TailoredResumeInput,
  type GenerateTailoredResumeOptions,
} from "./generateTailoredResume";
export { escapeLatex, resumeToLatexBody } from "./resumeToLatex";
export {
  normalize,
  resumeToSearchText,
  isMatched,
  findKeywordSpans,
  scoreResume,
  getMatchLabel,
  KEYWORD_CATEGORIES,
  CATEGORY_WEIGHTS,
  IMPORTANCE_WEIGHTS,
  STRONG_MATCH_THRESHOLD,
  GOOD_MATCH_THRESHOLD,
  type CategoryScore,
  type KeywordMatchResult,
  type MatchLabel,
  type ResumeScore,
  type TextSpan,
} from "./keywordMatch";
export {
  compileLatex,
  LatexCompileError,
  resolveLatexCompileUrl,
  LATEX_COMPILE_TIMEOUT_MS,
  type CompileLatexOptions,
} from "./compileLatex";
