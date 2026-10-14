import { FiCheck } from 'react-icons/fi';

type KeywordTagProps = {
  label: string;
  matched: boolean;
  /** Shown as a native tooltip, e.g. "Required" or "Preferred". */
  hint?: string;
};

/** A matched keyword is filled light blue with a check; a missing one has a dashed outline. */
export default function KeywordTag({ label, matched, hint }: KeywordTagProps) {
  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        matched
          ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300'
          : 'border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500'
      }`}
    >
      {matched && <FiCheck className="h-3 w-3 flex-shrink-0" aria-hidden />}
      {label}
      <span className="sr-only">{matched ? '(in your resume)' : '(missing)'}</span>
    </span>
  );
}
