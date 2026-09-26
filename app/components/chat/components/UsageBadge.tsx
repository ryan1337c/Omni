"use client";

import { Gauge } from "lucide-react";

import type { UsageSnapshot } from "@/lib/credits/types";

type UsageBadgeProps = {
  tier: string | null;
  usage: UsageSnapshot | null;
};

export function UsageBadge({ tier, usage }: UsageBadgeProps) {
  if (tier !== "free" || !usage) {
    return null;
  }

  return (
    <span
      title="Free credits reset daily at 00:00 UTC"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium ${
        usage.remaining === 0
          ? "text-red-500 dark:text-red-400"
          : usage.remaining <= 5
            ? "text-amber-500 dark:text-amber-400"
            : "text-slate-400 dark:text-slate-500"
      }`}
    >
      <Gauge className="h-3.5 w-3.5" strokeWidth={2} />
      {usage.remaining}/{usage.limit}
      <span className="hidden sm:inline">&nbsp;today</span>
    </span>
  );
}
