"use client";

import { useMemo, useState } from 'react';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import { resolveCategory, type RequirementResult, type ResumeScore } from '@/lib/resume/keywordMatch';
import type { KeywordCategory, KeywordScoring, ResumeContent } from '@/lib/resume/schema';

import { KEYWORD_GROUPS, SCORE_RING_COLORS } from '../../constants';
import KeywordGroup from './KeywordGroup';
import Legend from './Legend';
import { coverageSummary, REQUIRED_GUIDE, requiredSummary } from './depthBands';
import ScoreRing from './ScoreRing';
import Switch from './Switch';

type AnalysisPanelProps = {
  analysis: ResumeScore;
  jobTitle: string;
  isHighlighting: boolean;
  onHighlightingChange: (enabled: boolean) => void;
  /** True once the editor's resume is not the one this analysis describes. */
  isStale: boolean;
  isScoring: boolean;
  scoredBy: KeywordScoring['scoredBy'];
  /** The resume `analysis` describes, which may differ from the one on screen. */
  scoredResume: ResumeContent;
  onReanalyze: () => void;
};

function groupByCategory(requirements: RequirementResult[]): Record<KeywordCategory, RequirementResult[]> {
  const groups: Record<KeywordCategory, RequirementResult[]> = { hard: [], soft: [], other: [] };
  for (const requirement of requirements) {
    groups[resolveCategory(requirement.best.keyword.category)].push(requirement);
  }
  return groups;
}

export default function AnalysisPanel({
  analysis,
  jobTitle,
  isHighlighting,
  onHighlightingChange,
  isStale,
  isScoring,
  scoredBy,
  scoredResume,
  onReanalyze,
}: AnalysisPanelProps) {
  const { score, label, requirements } = analysis;
  const groups = useMemo(() => groupByCategory(requirements), [requirements]);
  const summary = useMemo(() => coverageSummary(requirements.map(({ best }) => best)), [requirements]);
  const requiredShown = useMemo(() => requiredSummary(requirements), [requirements]);
  const [highlightRequired, setHighlightRequired] = useState(false);
  const canReanalyze = isStale && !isScoring;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ScoreRing score={score} colorClassName={SCORE_RING_COLORS[label]} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
            {label} for <em className="break-words">{jobTitle.trim() || 'this role'}</em>
          </h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-gray-400">{summary}</p>
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
              className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 ${
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

      {requiredShown && (
        <section className="rounded-lg border border-yellow-400/80 bg-yellow-50 px-4 py-3.5 dark:border-yellow-400/50 dark:bg-yellow-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-bold leading-none text-slate-900"
                aria-hidden
              >
                !
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{REQUIRED_GUIDE.title}</h3>
            </div>
            <span className="flex-shrink-0 rounded-full border border-yellow-400/40 bg-yellow-100/80 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-700 dark:border-yellow-400/20 dark:bg-yellow-900/40 dark:text-gray-300">
              {requiredShown}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-gray-400">{REQUIRED_GUIDE.meaning}</p>
          <label className="mt-3 flex items-center justify-between gap-3 border-t border-yellow-300/80 pt-3 text-sm font-medium text-slate-800 dark:border-yellow-400/20 dark:text-gray-100">
            Highlight required
            <Switch checked={highlightRequired} onChange={setHighlightRequired} tone="amber" />
          </label>
        </section>
      )}

      {KEYWORD_GROUPS.map(({ category, title, subtitle }) =>
        groups[category].length > 0 ? (
          <KeywordGroup
            key={category}
            title={title}
            subtitle={subtitle}
            requirements={groups[category]}
            scoredResume={scoredResume}
            highlightRequired={highlightRequired}
          />
        ) : null,
      )}

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Highlight keywords</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
            Mark matched keywords on the resume
          </p>
        </div>
        <Switch checked={isHighlighting} onChange={onHighlightingChange} label="Highlight keywords" />
      </div>

      <Legend />
    </div>
  );
}
