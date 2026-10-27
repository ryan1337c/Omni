"use client";

import { useId, useState, type ReactNode } from 'react';
import { FiChevronDown } from 'react-icons/fi';

import KeywordTag from './KeywordTag';
import { DEPTH_BANDS, DEPTH_LEVEL_GUIDE as GUIDE, depthBandName } from './depthBands';

const LEGEND = DEPTH_BANDS.map((band) => ({ band, label: depthBandName(band) }));

function GuideRow({ chip, meaning, children }: { chip: ReactNode; meaning: string; children: ReactNode }) {
  return (
    <li className="space-y-1">
      {chip}
      <p className="text-slate-700 dark:text-gray-200">{meaning}</p>
      {children}
    </li>
  );
}

/** Chip legend with a "What do these mean?" toggle that expands the full Depth Level guide in place. */
export default function Legend() {
  const [isOpen, setIsOpen] = useState(false);
  const guideId = useId();

  return (
    <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-700 dark:text-gray-400">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEGEND.map(({ band, label }) => (
          <span key={band} className="flex items-center gap-2">
            <KeywordTag label="Skill" band={band} /> {label}
          </span>
        ))}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={guideId}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-center gap-1 rounded font-medium text-sky-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-sky-400"
        >
          What do these mean?
          <FiChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      <div id={guideId} hidden={!isOpen} className="mt-4 space-y-4">
        {GUIDE.groups.map((group) => (
          <section key={group.category}>
            <h4 className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">{group.title}</h4>
            <ul className="space-y-2">
              {group.states.map((state) => (
                <GuideRow
                  key={state.name}
                  chip={<KeywordTag label={state.name} band={state.band} />}
                  meaning={state.meaning}
                >
                  <p>Tip: {state.tip}</p>
                </GuideRow>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h4 className="mb-2 text-xs font-semibold text-slate-900 first-letter:uppercase dark:text-white">
            {GUIDE.notNamed.label}
          </h4>
          <ul>
            <GuideRow
              chip={<KeywordTag label="Skill" band={GUIDE.notNamed.band} srLabel={GUIDE.notNamed.label} implied />}
              meaning={GUIDE.notNamed.meaning}
            >
              <p>Tip for Hard Skills: {GUIDE.notNamed.hardTip}</p>
              <p>Tip for Soft Skills: {GUIDE.notNamed.softTip}</p>
            </GuideRow>
          </ul>
        </section>
      </div>
    </div>
  );
}
