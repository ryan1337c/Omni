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

  /** Sections whose Entries are each their own Placement. `entry` indexes that section's array. */
  export type PlacementEntrySection = "experience" | "projects" | "education";

  /** Skills Listing Sections that are one Placement as a whole. */
  export type WholeSectionPlacement = "summary" | "skills" | "honors";

  /** Where a Placement is: one Entry, or a whole Professional Summary, Technical Skills, or Honors Section. */
  export type PlacementSource =
    | { section: PlacementEntrySection; entry: number }
    | { section: WholeSectionPlacement };

  export type PlacementEvidence = {
    source: PlacementSource;
    /** 0–1 likelihood that the Placement shows the skill in that sense. A literal match in Technical Skills is 1. */
    presence: number;
    /** 1–3 Depth Level at this Placement, fractions kept. */
    depthLevel: number;
  };

  /** One Bullet: `experience[entry].bullets[bullet]` or `projects[entry].bullets[bullet]`. */
  export type BulletRef = { section: "experience" | "projects"; entry: number; bullet: number };

  /**
   * A Hard or Soft Skill. `explicit` is true when its term or an alias is named anywhere on the resume.
   * With no `placements` it is Absent; with placements and `explicit` false it is Implied.
   */
  export type SkillEvidence = {
    kind: "skill";
    explicit: boolean;
    placements: PlacementEvidence[];
    /** Bullets that are a specific example of a Soft Skill. Always empty for Hard Skills. */
    demonstratingBullets: BulletRef[];
  };

  export type OtherKeywordEvidence = {
    kind: "other";
    /** 0–1. */
    matchProbability: number;
  };

  export type KeywordEvidence = SkillEvidence | OtherKeywordEvidence;

  /**
   * One scoring pass over a keyword list. `evidence[i]` describes `keywords[i]`.
   * `scoredBy` records the source so callers can tell a Jev pass from the
   * fallback (every Explicit Skill Mentioned, Other only on a literal match)
   * without inspecting the evidence.
   *
   * Produced by `jevScore.ts`; validated by `parseKeywordScoring`; turned into credit by
   * `scoreKeywordEvidence` on the server and again in the browser by `useKeywordScoring.ts`;
   * shown by `depthBands.ts`, `KeywordTag.tsx`, and `AnalysisPanel.tsx`.
   */
  export type KeywordScoring = {
    evidence: KeywordEvidence[];
    scoredBy: "jev" | "keyword";
  };

  /**
   * `/api/generateResume` response. Scoring is attached after the model returns,
   * so `TailoredResumeResponse` (the parsed model payload) stays unchanged.
   */
  export type TailoredResumeResult = TailoredResumeResponse & {
    scoring: KeywordScoring;
  };