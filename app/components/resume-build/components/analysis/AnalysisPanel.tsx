"use client";

import { useMemo } from 'react';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import { resolveCategory, type KeywordMatchResult, type ResumeScore } from '@/lib/resume/keywordMatch';
import type { KeywordCategory, KeywordScoring, ResumeContent } from '@/lib/resume/schema';

import { KEYWORD_GROUPS, SCORE_RING_COLORS } from '../../constants';
import KeywordGroup from './KeywordGroup';
import Legend from './Legend';
import { coverageSummary } from './depthBands';
import ScoreRing from './ScoreRing';

type AnalysisPanelProps = {
  analysis: ResumeScore;
  jobTitle: string;
  highlightKeywords: boolean;
  onHighlightKeywordsChange: (enabled: boolean) => void;
  /** True once the editor's resume is not the one this analysis describes. */
  isStale: boolean;
  isScoring: boolean;
  scoredBy: KeywordScoring['scoredBy'];
  /** The resume `analysis` describes, which may differ from the one on screen. */
  scoredResume: ResumeContent;
  onReanalyze: () => void;
};

function groupByCategory(results: KeywordMatchResult[]): Record<KeywordCategory, KeywordMatchResult[]> {
  const groups: Record<KeywordCategory, KeywordMatchResult[]> = { hard: [], soft: [], other: [] };
  for (const result of results) {
    groups[resolveCategory(result.keyword.category)].push(result);
  }
  return groups;
}

export default function AnalysisPanel({
  analysis,
  jobTitle,
  highlightKeywords,
  onHighlightKeywordsChange,
  isStale,
  isScoring,
  scoredBy,
  scoredResume,
  onReanalyze,
}: AnalysisPanelProps) {
  const { score, label, results } = analysis;
  const groups = useMemo(() => groupByCategory(results), [results]);
  const summary = useMemo(() => coverageSummary(results), [results]);
  const canReanalyze = isStale && !isScoring;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ScoreRing score={score} colorClassName={SCORE_RING_COLORS[label]} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
            {label} for <em className="break-words">{jobTitle.trim() || 'this role'}</em>
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{summary}</p>
          {scoredBy === 'keyword' && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Meaning-based scoring unavailable, so skills were matched by exact wording only:
              each one found counts as Mentioned, and other requirements count only on an exact
              match.
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                void onReanalyze();
              }}
              disabled={!canReanalyze}
              aria-busy={isScoring}
              title={
                isScoring
                  ? 'Scoring your resume'
                  : isStale
                    ? 'Score the resume again'
                    : 'No edits since the last score'
              }
              className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 ${
                isScoring ? 'disabled:cursor-wait' : 'disabled:cursor-not-allowed'
              }`}
            >
              {isScoring ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <FiRefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              {isScoring ? 'Re-analyzing...' : 'Re-analyze'}
            </button>
          </div>
        </div>
      </div>

      {KEYWORD_GROUPS.map(({ category, title, subtitle }) =>
        groups[category].length > 0 ? (
          <KeywordGroup
            key={category}
            title={title}
            subtitle={subtitle}
            results={groups[category]}
            scoredResume={scoredResume}
          />
        ) : null,
      )}

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Highlight keywords</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
            Mark matched keywords on the resume
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={highlightKeywords}
          aria-label="Highlight keywords"
          onClick={() => onHighlightKeywordsChange(!highlightKeywords)}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none hover:ring-1 hover:ring-sky-500 hover:ring-offset-2 dark:hover:ring-offset-slate-800 ${
            highlightKeywords ? 'bg-sky-600 dark:bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              highlightKeywords ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <Legend />
    </div>
  );
}
