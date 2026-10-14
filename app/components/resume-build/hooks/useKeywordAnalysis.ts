"use client";

import { useEffect, useMemo, useState } from "react";

import { scoreResume, type ResumeScore } from "@/lib/resume/keywordMatch";
import type { JdKeyword, ResumeContent } from "@/lib/resume/schema";

import { KEYWORD_ANALYSIS_DEBOUNCE_MS } from "../constants";

/** Live keyword score for the resume being edited, recomputed shortly after each edit. */
export function useKeywordAnalysis(keywords: JdKeyword[], resume: ResumeContent): ResumeScore {
  // Starts with the initial resume so the first render is scored without waiting.
  const [scoredResume, setScoredResume] = useState(resume);

  useEffect(() => {
    const timer = setTimeout(() => setScoredResume(resume), KEYWORD_ANALYSIS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [resume]);

  return useMemo(() => scoreResume(keywords, scoredResume), [keywords, scoredResume]);
}
