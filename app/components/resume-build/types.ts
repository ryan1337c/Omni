import type { TailoredResumeResult } from "@/lib/resume/schema";

export type ResumeBuildProps = {
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};

export type ResumeRequestInput = {
  file: File;
  jobTitle: string;
  jobDescription: string;
};

export type ResultsTabId = "analysis" | "design" | "coverLetter";

export type ResumeBuildState =
  | { step: "upload" }
  | { step: "results"; tailored: TailoredResumeResult; jobTitle: string };
