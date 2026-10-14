import type { KeywordMatchResult } from '@/lib/resume/keywordMatch';

import KeywordTag from './KeywordTag';

type KeywordGroupProps = {
  title: string;
  subtitle: string;
  results: KeywordMatchResult[];
};

export default function KeywordGroup({ title, subtitle, results }: KeywordGroupProps) {
  const matchedCount = results.filter((result) => result.matched).length;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-gray-400">
          {matchedCount}/{results.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {results.map(({ keyword, matched }, index) => (
          <KeywordTag
            key={`${keyword.term}-${index}`}
            label={keyword.term}
            matched={matched}
            hint={keyword.importance === 'required' ? 'Required' : 'Preferred'}
          />
        ))}
      </div>
    </section>
  );
}
