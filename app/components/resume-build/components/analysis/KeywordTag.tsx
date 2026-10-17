import { FiCheck } from 'react-icons/fi';

import { rubricBand, rubricBandName, type RubricBand } from './rubricBands';

type KeywordTagProps = {
  label: string;
  /** 1–4 rubric level. Fractions are rounded to the nearest band. */
  level: number;
  /** Shown as a native tooltip, e.g. "Required - Applied (3/4)". */
  hint?: string;
};

const BAND_CLASS: Record<RubricBand, string> = {
  // Absent: not on the resume.
  1: 'border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500',
  // Listed: named, without project or duty detail.
  2: 'border-slate-300 text-slate-600 dark:border-slate-500 dark:text-slate-300',
  // Applied: used with context.
  3: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  // Core: central to a production-level feature.
  4: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** One keyword chip. The check is reserved for Core; lower bands are outline or fill only. */
export default function KeywordTag({ label, level, hint }: KeywordTagProps) {
  const band = rubricBand(level);
  const name = rubricBandName(level);

  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${BAND_CLASS[band]}`}
    >
      {band === 4 && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      <span className="sr-only">{`(${name}, ${band} of 4)`}</span>
    </span>
  );
}
