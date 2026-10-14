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
  
  export type ResumeContent = {
    header: ResumeHeader;
    education: EducationEntry[];
    experience: ExperienceEntry[];
    projects: ProjectEntry[];
    skills: SkillEntry[];
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
  }