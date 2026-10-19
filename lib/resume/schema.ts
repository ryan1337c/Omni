export type ResumeHeader = {
    name: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
  };
  
  export type EducationEntry = {
    institution: string;
    location: string;
    degree: string;
    dates: string;
    bullets: string[];
  };
  
  export type ExperienceEntry = {
    title: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  };
  
  export type ProjectEntry = {
    name: string;
    technologies: string;
    dates: string;
    bullets: string[];
  };
  
  export type SkillEntry = {
    category: string;
    items: string;
  };
  
  /** One line in Licenses, Certifications, and Awards. `description` is "" when the source gives no context. */
  export type HonorEntry = {
    title: string;
    issuer: string;
    date: string;
    description: string;
  };

  export const DEFAULT_SECTION_ORDER = [
    "summary",
    "education",
    "experience",
    "projects",
    "skills",
    "honors",
  ] as const;

  export type SectionId = (typeof DEFAULT_SECTION_ORDER)[number];

  export const SECTION_TITLES: Record<SectionId, string> = {
    summary: "Professional Summary",
    education: "Education",
    experience: "Experience",
    projects: "Projects",
    skills: "Technical Skills",
    honors: "Licenses, Certifications, and Awards",
  };

  export type ResumeContent = {
    header: ResumeHeader;
    /** "" when the source resume has no summary to tailor. */
    summary: string;
    education: EducationEntry[];
    experience: ExperienceEntry[];
    projects: ProjectEntry[];
    skills: SkillEntry[];
    honors: HonorEntry[];
    /** Every `SectionId` exactly once. Empty sections keep their slot but are not shown. */
    sectionOrder: SectionId[];
  };
  
  export type KeywordCategory = "hard" | "soft" | "other";

  export type JdKeyword = {
    term: string; // display label, e.g. "Google Analytics"
    aliases: string[]; // e.g. ["GA4"], ["A/B tests", "split testing"]
    category: KeywordCategory;
    importance: "required" | "preferred";
  }

  export type TailoredResumeResponse = {
    resume: ResumeContent;
    keywords: JdKeyword[];
  };

  /**
   * One scoring pass over a keyword list.
   * `levels[i]` is the 1–4 rubric level for `keywords[i]` (fractions kept).
   * `scoredBy` records the source so callers can tell a Jev pass from the
   * string-match fallback without inspecting the numbers.
   */
  export type KeywordScoring = {
    levels: number[];
    scoredBy: "jev" | "keyword";
  };

  /**
   * `/api/generateResume` response. Scoring is attached after the model returns,
   * so `TailoredResumeResponse` (the parsed model payload) stays unchanged.
   */
  export type TailoredResumeResult = TailoredResumeResponse & {
    scoring: KeywordScoring;
  };