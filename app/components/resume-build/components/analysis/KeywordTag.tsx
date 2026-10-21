import { FiCheck } from 'react-icons/fi';

import { ABSENT_LEVEL, MAX_DEPTH_LEVEL } from '@/lib/resume/keywordMatch';

import { depthBand, depthBandName, type DepthBand } from './depthBands';

type KeywordTagProps = {
  label: string;
  /** 0 (Absent) or a 1–4 Depth Level. Fractions are rounded to the nearest band. */
  level: number;
  /** Shown as a native tooltip, e.g. "Required - Applied / Production (3/4)". */
  hint?: string;
};

/** Absent is dashed; fill strengthens with depth. */
const BAND_CLASS: Record<DepthBand, string> = {
  0: 'border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500',
  1: 'border-slate-300 text-slate-600 dark:border-slate-500 dark:text-slate-300',
  2: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-700/50 dark:text-slate-200',
  3: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  4: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** One keyword chip. The check is reserved for the top Depth Level; lower bands are outline or fill only. */
export default function KeywordTag({ label, level, hint }: KeywordTagProps) {
  const band = depthBand(level);
  const name = depthBandName(level);
  const srLabel = band === ABSENT_LEVEL ? `(${name})` : `(${name}, ${band} of ${MAX_DEPTH_LEVEL})`;

  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${BAND_CLASS[band]}`}
    >
      {band === MAX_DEPTH_LEVEL && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      <span className="sr-only">{srLabel}</span>
    </span>
  );
}
