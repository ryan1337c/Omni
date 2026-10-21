"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  estimateKeywordLevels,
  scoreKeywordLevels,
  type ResumeScore,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword, KeywordScoring, ResumeContent, TailoredResumeResult } from "@/lib/resume/schema";

import { scoreResumeRequest, type ScoreResume } from "../api";

export type KeywordScoringView = {
  analysis: ResumeScore;
  /** True when `resume` is not the object the current levels were scored against. */
  isStale: boolean;
  isScoring: boolean;
  scoredBy: KeywordScoring["scoredBy"];
  reanalyze: () => Promise<void>;
};

/**
 * Seed from the generate pass. A missing or mis-sized payload falls back to
 * Mentioned / Absent so the panel can still render.
 */
function initialScoring(tailored: TailoredResumeResult): KeywordScoring {
  const { scoring, keywords, resume } = tailored;
  const usable =
    scoring != null &&
    (scoring.scoredBy === "jev" || scoring.scoredBy === "keyword") &&
    Array.isArray(scoring.levels) &&
    scoring.levels.length === keywords.length &&
    scoring.levels.every((level) => typeof level === "number" && Number.isFinite(level));

  if (usable) return scoring;

  return {
    levels: estimateKeywordLevels(keywords, resume),
    scoredBy: "keyword",
  };
}

/**
 * Levels that `scoreKeywordLevels` can aggregate. A bad pass falls back to
 * Mentioned / Absent rather than throwing into the results view.
 */
function levelsForKeywords(keywords: JdKeyword[], levels: number[], resume: ResumeContent): number[] {
  if (levels.length === keywords.length) return levels;
  return estimateKeywordLevels(keywords, resume);
}

/**
 * Last Depth Level pass for the resume on screen, refreshed only when the user asks.
 *
 * Each piece changes on its own (SRP):
 * - this hook stores one pass and whether it still describes `resume`
 * - `requestScore` is the only network call (DIP: the default is `scoreResumeRequest`)
 * - `scoreKeywordLevels` turns levels into the score the panel renders
 *
 * Edits do not re-score. `isStale` compares object identity because the editor
 * returns a new resume on every change and keeps the same object otherwise.
 */
export function useKeywordScoring(
  tailored: TailoredResumeResult,
  resume: ResumeContent,
  onError: (message: string) => void,
  requestScore: ScoreResume = scoreResumeRequest,
): KeywordScoringView {
  // One object so `levels` and `scoredBy` always come from the same pass.
  const [scoring, setScoring] = useState(() => initialScoring(tailored));
  // Generate scored `tailored.resume`. The editor starts from that same object.
  const [scoredResume, setScoredResume] = useState<ResumeContent>(tailored.resume);
  const [isScoring, setIsScoring] = useState(false);
  // Blocks a second click before the disabled state re-renders.
  const inFlight = useRef(false);

  const reanalyze = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsScoring(true);
    // Score the resume from this click. Later edits stay stale until the next pass.
    const snapshot = resume;

    try {
      const next = await requestScore(snapshot, tailored.keywords);
      setScoring(next);
      setScoredResume(snapshot);
    } catch (error) {
      console.error("Keyword scoring failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      onError(`Couldn't re-analyze your resume: ${message}`);
    } finally {
      inFlight.current = false;
      setIsScoring(false);
    }
  }, [onError, requestScore, resume, tailored.keywords]);

  const levels = useMemo(
    () => levelsForKeywords(tailored.keywords, scoring.levels, scoredResume),
    [scoredResume, scoring.levels, tailored.keywords],
  );

  // Placement is read from the scored resume, so edits change nothing until Re-analyze.
  const analysis = useMemo(
    () => scoreKeywordLevels(tailored.keywords, levels, scoredResume),
    [levels, scoredResume, tailored.keywords],
  );

  return {
    analysis,
    isStale: resume !== scoredResume,
    isScoring,
    scoredBy: scoring.scoredBy,
    reanalyze,
  };
}
