import { FiCheck } from 'react-icons/fi';

import { rubricBand, rubricBandName, type RubricBand } from './rubricBands';

type KeywordTagProps = {
  label: string;
  /** 0 (Absent) or a 1–4 Depth Level. Fractions are rounded to the nearest band. */
  level: number;
  /** Shown as a native tooltip, e.g. "Required - Applied (3/4)". */
  hint?: string;
};

const BAND_CLASS: Record<RubricBand, string> = {
  // Absent: not named on the resume.
  0: 'border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500',
  // Mentioned: named, without evidence of use.
  1: 'border-slate-300 text-slate-600 dark:border-slate-500 dark:text-slate-300',
  // Familiarity: introductory exposure.
  2: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-700/50 dark:text-slate-200',
  // Applied: practical use with context.
  3: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  // Advanced: substantial technical depth.
  4: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** One keyword chip. The check is reserved for Advanced; lower bands are outline or fill only. */
export default function KeywordTag({ label, level, hint }: KeywordTagProps) {
  const band = rubricBand(level);
  const name = rubricBandName(level);
  const srLabel = band === 0 ? `(${name})` : `(${name}, ${band} of 4)`;

  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${BAND_CLASS[band]}`}
    >
      {band === 4 && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      <span className="sr-only">{srLabel}</span>
    </span>
  );
}
