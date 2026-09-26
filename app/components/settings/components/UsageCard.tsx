"use client";

import type { UsageSnapshot } from "@/lib/credits/types";
import { formatCreditReset } from "@/lib/credits/usageClient";

import { getUsagePercent } from "../utils";

type UsageCardProps = {
  isFreeTier: boolean;
  usage: UsageSnapshot | null;
  isUsageLoading: boolean;
  usageError: string;
};

export default function UsageCard({
  isFreeTier,
  usage,
  isUsageLoading,
  usageError,
}: UsageCardProps) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {usage?.period === "day" || (!usage && isFreeTier)
          ? "Usage today"
          : "Usage this month"}
      </h4>
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        {isUsageLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        ) : usageError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {usageError}
          </p>
        ) : usage ? (
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {usage.used} / {usage.limit} credits
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {usage.remaining} remaining
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={usage.limit}
              aria-valuenow={Math.min(usage.used, usage.limit)}
              aria-label="Credit usage"
            >
              <div
                className="h-full rounded-full bg-violet-600 dark:bg-purple-500"
                style={{ width: `${getUsagePercent(usage)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Resets {formatCreditReset(usage.resetsAt, usage.period)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Usage is unavailable.
          </p>
        )}
      </div>
    </section>
  );
}
