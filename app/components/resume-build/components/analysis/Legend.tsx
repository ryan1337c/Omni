"use client";

import KeywordTag from './KeywordTag';
import { DEPTH_BANDS, depthBandName } from './depthBands';

const LEGEND = DEPTH_BANDS.map((band) => ({ band, label: depthBandName(band) }));

type LegendProps = {
  /** `match` is the keyword-fallback key: matched vs missing, with no Depth Levels. */
  variant?: 'depth' | 'match';
};

/** Chip legend for analysis tags: Depth Level colors, or matched / missing in fallback. */
export default function Legend({ variant = 'depth' }: LegendProps) {
  return (
    <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-700 dark:text-gray-400">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {variant === 'match' ? (
          <>
            <span className="flex items-center gap-2">
              <KeywordTag label="Matched" look="match" matched /> Matched
            </span>
            <span className="flex items-center gap-2">
              <KeywordTag label="Missing" look="match" matched={false} /> Missing
            </span>
          </>
        ) : (
          LEGEND.map(({ band, label }) => (
            <span key={band} className="flex items-center gap-2">
              <KeywordTag label="Skill" band={band} /> {label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
