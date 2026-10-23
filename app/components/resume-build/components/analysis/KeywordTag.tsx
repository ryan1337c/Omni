import { FiAlertCircle, FiCheck } from 'react-icons/fi';

import { MAX_DEPTH_LEVEL } from '@/lib/resume/keywordMatch';

import type { DepthBand } from './depthBands';

type KeywordTagProps = {
  label: string;
  band: DepthBand;
  /** Screen-reader text after the label, e.g. "Familiarity, 2 of 3". */
  srLabel?: string;
  /** An Implied Skill: keeps its band look and adds a "not named" marker. */
  notNamed?: boolean;
};

/** Absent is dashed; fill strengthens with depth. */
const BAND_CLASS: Record<DepthBand, string> = {
  0: 'border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500',
  1: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  2: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  3: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** One keyword chip. The check is reserved for the top band; lower bands are outline or fill only. */
export default function KeywordTag({ label, band, srLabel, notNamed = false }: KeywordTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${BAND_CLASS[band]}`}
    >
      {band === MAX_DEPTH_LEVEL && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      {notNamed && <FiAlertCircle className="h-3 w-3 flex-shrink-0 opacity-80" aria-hidden />}
      {srLabel && <span className="sr-only">({srLabel})</span>}
    </span>
  );
}
