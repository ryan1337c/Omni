import type { KeywordCategory } from "@/lib/resume/schema";
import type { MatchLabel } from "@/lib/resume/keywordMatch";

import type { ResultsTabId } from "./types";

export const ERROR_TOAST_DURATION_MS = 5000;

// Lets the processing toast finish sliding out before the results view mounts.
export const RESULTS_TRANSITION_DELAY_MS = 300;

// Re-score only after typing pauses, so the score ring isn't re-animating on every keystroke.
export const KEYWORD_ANALYSIS_DEBOUNCE_MS = 250;

export const RESUME_DOWNLOAD_FILENAME = "Tailored_Resume.pdf";

// US Letter at CSS's fixed 96px per inch.
export const PAPER_WIDTH_PX = 8.5 * 96;
export const PAPER_HEIGHT_PX = 11 * 96;

export const RESULTS_TABS: readonly { id: ResultsTabId; label: string }[] = [
  { id: "analysis", label: "Analysis" },
  { id: "design", label: "Design" },
  { id: "coverLetter", label: "Cover letter" },
];

export const KEYWORD_GROUPS: readonly {
  category: KeywordCategory;
  title: string;
  subtitle: string;
}[] = [
  { category: "hard", title: "Hard skills", subtitle: "Tools, technologies, and methods" },
  { category: "soft", title: "Soft skills", subtitle: "Interpersonal and work-style traits" },
  { category: "other", title: "Other", subtitle: "Certifications, degrees, and languages" },
];

export const SCORE_RING_COLORS: Record<MatchLabel, string> = {
  "Strong match": "text-emerald-500 dark:text-emerald-400",
  "Good match": "text-sky-500 dark:text-sky-400",
  "Fair match": "text-amber-500 dark:text-amber-400",
};
