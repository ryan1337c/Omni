"use client";

import { useMemo } from 'react';
import type { KeywordMatchResult, ResumeScore } from '@/lib/resume/keywordMatch';
import type { KeywordCategory } from '@/lib/resume/schema';

import { KEYWORD_GROUPS, SCORE_RING_COLORS } from '../../constants';
import KeywordGroup from './KeywordGroup';
import KeywordTag from './KeywordTag';
import ScoreRing from './ScoreRing';

type AnalysisPanelProps = {
  analysis: ResumeScore;
  jobTitle: string;
  highlightKeywords: boolean;
  onHighlightKeywordsChange: (enabled: boolean) => void;
};

function groupByCategory(results: KeywordMatchResult[]): Record<KeywordCategory, KeywordMatchResult[]> {
  const groups: Record<KeywordCategory, KeywordMatchResult[]> = { hard: [], soft: [], other: [] };
  for (const result of results) {
    // Mirrors scoreResume, which counts unknown categories as "other".
    (groups[result.keyword.category] ?? groups.other).push(result);
  }
  return groups;
}

export default function AnalysisPanel({
  analysis,
  jobTitle,
  highlightKeywords,
  onHighlightKeywordsChange,
}: AnalysisPanelProps) {
  const { score, label, matched, total, results } = analysis;
  const groups = useMemo(() => groupByCategory(results), [results]);
  const missing = total - matched;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ScoreRing score={score} colorClassName={SCORE_RING_COLORS[label]} />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
            {label} for <em className="break-words">{jobTitle.trim() || 'this role'}</em>
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Your resume covers {matched} of {total} keywords from the job description.
            {missing > 0
              ? ' Add the dashed ones below to push your score higher.'
              : ' Nice work, every keyword is covered.'}
          </p>
        </div>
      </div>

      {KEYWORD_GROUPS.map(({ category, title, subtitle }) =>
        groups[category].length > 0 ? (
          <KeywordGroup key={category} title={title} subtitle={subtitle} results={groups[category]} />
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-gray-400">
        <span className="flex items-center gap-2">
          <KeywordTag label="Skill" matched /> In your resume
        </span>
        <span className="flex items-center gap-2">
          <KeywordTag label="Skill" matched={false} /> Missing
        </span>
      </div>
    </div>
  );
}
