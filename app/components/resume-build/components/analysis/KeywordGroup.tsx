import type { KeywordMatchResult } from '@/lib/resume/keywordMatch';

import KeywordTag from './KeywordTag';
import { keywordChip } from './depthBands';

type KeywordGroupProps = {
  title: string;
  subtitle: string;
  results: KeywordMatchResult[];
};

export default function KeywordGroup({ title, subtitle, results }: KeywordGroupProps) {
  // `matched` is true for Explicit Skills and for Other Keywords that earn credit.
  const presentCount = results.filter((result) => result.matched).length;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-gray-400">
          {presentCount}/{results.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {results.map((result, index) => {
          const { band, srLabel, hint } = keywordChip(result);
          return (
            <KeywordTag
              key={`${result.keyword.term}-${index}`}
              label={result.keyword.term}
              band={band}
              srLabel={srLabel}
              hint={hint}
            />
          );
        })}
      </div>
    </section>
  );
}
