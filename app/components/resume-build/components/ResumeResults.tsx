"use client";

import { useState } from 'react';
import { FiArrowLeft, FiDownload, FiLoader } from 'react-icons/fi';
import type { KeywordMatchResult } from '@/lib/resume/keywordMatch';
import type { TailoredResumeResult } from '@/lib/resume/schema';

import { useKeywordScoring } from '../hooks/useKeywordScoring';
import { useResumeDownload } from '../hooks/useResumeDownload';
import { useResumeEditor } from '../hooks/useResumeEditor';
import AnalysisPanel from './analysis/AnalysisPanel';
import JakeResumePaper from './editor/JakeResumePaper';
import ResultsTabs from './ResultsTabs';

type ResumeResultsProps = {
  tailored: TailoredResumeResult;
  jobTitle: string;
  onStartOver: () => void;
  /** Routes failures (PDF compile errors, re-analyze) to ResumeBuild's error toast. */
  onError: (message: string) => void;
};

const NO_HIGHLIGHTS: KeywordMatchResult[] = [];

/**
 * Results step: keyword analysis on the left, the editable resume on the right.
 * Edits live only in this component's state; leaving the step discards them.
 */
export default function ResumeResults({ tailored, jobTitle, onStartOver, onError }: ResumeResultsProps) {
  const { resume, actions } = useResumeEditor(tailored.resume);
  const { analysis, isStale, isScoring, scoredBy, reanalyze } = useKeywordScoring(
    tailored,
    resume,
    onError,
  );
  const { download, isDownloading } = useResumeDownload(onError);
  const [highlightKeywords, setHighlightKeywords] = useState(false);

  return (
    // Below xl the panels stack and the whole view scrolls; from xl up each panel scrolls on its own.
    <div className="flex-1 min-h-0 overflow-y-auto xl:overflow-hidden custom-scrollbar animate-fade-in-up-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-6 xl:h-full">
        <div className="flex flex-shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onStartOver}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            Start Over
          </button>

          <button
            type="button"
            onClick={() => download(resume)}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70 dark:bg-btnDark dark:hover:brightness-[.9]"
          >
            {isDownloading ? (
              <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <FiDownload className="h-4 w-4" aria-hidden />
            )}
            {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        <div className="flex flex-col gap-4 xl:min-h-0 xl:flex-1 xl:flex-row">
          <aside className="flex-shrink-0 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 xl:w-[380px] xl:overflow-y-auto custom-scrollbar">
            <ResultsTabs
              panels={{
                analysis: (
                  <AnalysisPanel
                    analysis={analysis}
                    jobTitle={jobTitle}
                    highlightKeywords={highlightKeywords}
                    onHighlightKeywordsChange={setHighlightKeywords}
                    isStale={isStale}
                    isScoring={isScoring}
                    scoredBy={scoredBy}
                    onReanalyze={reanalyze}
                  />
                ),
              }}
            />
          </aside>

          <section
            aria-label="Resume editor"
            className="resume-canvas min-w-0 flex-1 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-8 xl:overflow-y-auto custom-scrollbar"
          >
            <div className="mx-auto max-w-[816px]">
              <JakeResumePaper
                resume={resume}
                actions={actions}
                highlightKeywords={highlightKeywords ? analysis.results : NO_HIGHLIGHTS}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
