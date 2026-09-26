import type { UsageSnapshot } from "@/lib/credits/types";

import type { BillingSummary } from "./types";

export function getPlanStatusText(billingSummary: BillingSummary | null) {
  return billingSummary?.cancel_at_period_end
    ? billingSummary.tier_expires_at
      ? `Access continues until ${new Date(
          billingSummary.tier_expires_at,
        ).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      : "Your subscription will cancel at the end of the current period"
    : billingSummary?.tier_expires_at
      ? `Current period ends ${new Date(
          billingSummary.tier_expires_at,
        ).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      : "Your subscription is active";
}

export function getPlanBadgeText(billingSummary: BillingSummary | null) {
  return billingSummary?.cancel_at_period_end
    ? billingSummary.tier_expires_at
      ? `Cancels ${new Date(billingSummary.tier_expires_at).toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
          },
        )}`
      : "Cancelling"
    : "Active";
}

export function getUsagePercent(usage: UsageSnapshot) {
  return usage.limit === 0
    ? 0
    : Math.min(100, (usage.used / usage.limit) * 100);
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
