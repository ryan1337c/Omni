"use client";

import { useState, type ReactNode } from 'react';

import { RESULTS_TABS } from '../constants';
import type { ResultsTabId } from '../types';

type ResultsTabsProps = {
  /** A tab is enabled only when it has a panel; the rest render disabled with a "Coming soon" tooltip. */
  panels: Partial<Record<ResultsTabId, ReactNode>>;
};

export default function ResultsTabs({ panels }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<ResultsTabId>('analysis');

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Resume results"
        className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900/60"
      >
        {RESULTS_TABS.map(({ id, label }) => {
          const enabled = panels[id] !== undefined;
          const selected = enabled && id === activeTab;

          return (
            // Wrapper carries the hover state, since disabled buttons don't receive pointer events in every browser.
            <div key={id} className="group relative flex-1">
              <button
                type="button"
                role="tab"
                id={`results-tab-${id}`}
                aria-selected={selected}
                aria-controls={selected ? `results-panel-${id}` : undefined}
                disabled={!enabled}
                onClick={() => setActiveTab(id)}
                className={`w-full rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-500 dark:disabled:hover:text-gray-400`}
              >
                {label}
              </button>

              {!enabled && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  Coming soon
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div role="tabpanel" id={`results-panel-${activeTab}`} aria-labelledby={`results-tab-${activeTab}`}>
        {panels[activeTab]}
      </div>
    </div>
  );
}
