"use client";

import type { BillingSummary } from "../types";
import { getPlanBadgeText, getPlanStatusText } from "../utils";

type CurrentPlanCardProps = {
  tier: string;
  billingSummary: BillingSummary | null;
  isBillingLoading: boolean;
  isCancelling: boolean;
  cancellationError: string;
  onCancelSubscription: () => void;
};

export default function CurrentPlanCard({
  tier,
  billingSummary,
  isBillingLoading,
  isCancelling,
  cancellationError,
  onCancelSubscription,
}: CurrentPlanCardProps) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Current Plan
      </h4>
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        {isBillingLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 pr-6">
                <p className="font-semibold capitalize text-slate-900 dark:text-white">
                  Omni {billingSummary?.tier ?? tier}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {getPlanStatusText(billingSummary)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  billingSummary?.cancel_at_period_end
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                }`}
              >
                {getPlanBadgeText(billingSummary)}
              </span>
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                onClick={onCancelSubscription}
                disabled={isCancelling || billingSummary?.cancel_at_period_end}
                className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10 dark:disabled:border-slate-600 dark:disabled:text-slate-500"
              >
                {billingSummary?.cancel_at_period_end
                  ? "Cancellation scheduled"
                  : isCancelling
                    ? "Cancelling..."
                    : "Cancel subscription"}
              </button>
            </div>

            {cancellationError && (
              <p
                role="alert"
                className="mt-2 text-right text-xs text-red-600 dark:text-red-400"
              >
                {cancellationError}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
