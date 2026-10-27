import type { ReactNode } from 'react';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';

import { MAX_DEPTH_LEVEL } from '@/lib/resume/keywordMatch';

import { REQUIRED_GUIDE, type ChipEmphasis, type DepthBand } from './depthBands';

type KeywordTagProps = {
  label: ReactNode;
  band: DepthBand;
  /** Screen-reader text after the label, e.g. "Familiarity, 2 of 3". */
  srLabel?: string;
  /** A Required Keyword: announced to screen readers. */
  required?: boolean;
  /** An Implied Skill: keeps its band look and adds a "not named" marker. */
  implied?: boolean;
  emphasis?: ChipEmphasis;
};

/** Absent is dashed; fill strengthens with depth. */
const BAND_CLASS: Record<DepthBand, string> = {
  0: 'border-dashed border-slate-400 text-slate-600 dark:border-slate-600 dark:text-slate-500',
  1: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  2: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  3: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** The offset keeps the gold ring apart from the amber Mentioned border. */
const EMPHASIS_CLASS: Record<ChipEmphasis, string> = {
  ring: 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-yellow-300 dark:ring-offset-slate-800',
  dim: 'opacity-40',
};

/** One keyword chip. The check is reserved for the top band; lower bands are outline or fill only. */
export default function KeywordTag({ label, band, srLabel, required = false, implied = false, emphasis }: KeywordTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${BAND_CLASS[band]} ${emphasis ? EMPHASIS_CLASS[emphasis] : ''}`}
    >
      {band === MAX_DEPTH_LEVEL && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      {implied && <FiAlertCircle className="h-3 w-3 flex-shrink-0 opacity-80" aria-hidden />}
      {srLabel && <span className="sr-only">({srLabel})</span>}
      {required && <span className="sr-only">({REQUIRED_GUIDE.title})</span>}
    </span>
  );
}
