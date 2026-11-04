"use client";

import { Lightbulb } from "lucide-react";

type ExplanationCalloutProps = {
  explanation: string;
};

export default function ExplanationCallout({ explanation }: ExplanationCalloutProps) {
  return (
    <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl border border-violet-200 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-900/20">
      <Lightbulb
        size={18}
        className="flex-shrink-0 mt-0.5 text-violet-600 dark:text-violet-400"
      />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300 mb-1">
          Explanation
        </div>
        <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
          {explanation}
        </p>
      </div>
    </div>
  );
}
