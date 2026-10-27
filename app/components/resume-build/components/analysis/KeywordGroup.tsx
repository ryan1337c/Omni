import { Fragment } from 'react';

import type { RequirementResult } from '@/lib/resume/keywordMatch';
import type { ResumeContent } from '@/lib/resume/schema';

import KeywordChipPopover from './KeywordChipPopover';
import { chipEmphasis, keywordChip, requiredFirst } from './depthBands';

type KeywordGroupProps = {
  title: string;
  subtitle: string;
  requirements: RequirementResult[];
  /** The resume `requirements` were scored against, for naming the Entries that showed an Implied Skill. */
  scoredResume: ResumeContent;
  /** Ring Required chips and fade the rest. */
  highlightRequired: boolean;
};

/** "Expo or React Native", with the option that earns the Credit emphasized once it matches. */
function requirementLabel({ options, best }: RequirementResult) {
  if (options.length === 1) return best.keyword.term;
  return options.map((option, index) => (
    <Fragment key={`${option.keyword.term}-${index}`}>
      {index > 0 && ' or '}
      <span className={best.matched && option === best ? 'font-semibold' : 'opacity-70'}>{option.keyword.term}</span>
    </Fragment>
  ));
}

export default function KeywordGroup({ title, subtitle, requirements, scoredResume, highlightRequired }: KeywordGroupProps) {
  // `matched` is true for Explicit and Implied Skills and for Other Keywords that earn credit.
  const presentCount = requirements.filter(({ best }) => best.matched).length;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-slate-700 dark:font-medium dark:text-gray-400">
          {presentCount}/{requirements.length}
        </span>
      </div>

      {/* Wider than the chip gap elsewhere: the highlight ring and its offset extend past each chip. */}
      <div className="flex flex-wrap gap-2.5">
        {requiredFirst(requirements).map((requirement, index) => {
          const chip = keywordChip(requirement.best, scoredResume);
          return (
            <KeywordChipPopover
              key={`${requirement.best.keyword.term}-${index}`}
              label={requirementLabel(requirement)}
              chip={chip}
              emphasis={chipEmphasis(chip, highlightRequired)}
              alternatives={
                requirement.options.length > 1
                  ? requirement.options.map((option) => ({
                      term: option.keyword.term,
                      state: keywordChip(option, scoredResume).srLabel,
                    }))
                  : []
              }
              clause={requirement.best.keyword.clause}
            />
          );
        })}
      </div>
    </section>
  );
}
