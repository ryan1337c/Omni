"use client";

import type { ReactNode } from "react";

type BillingSectionProps = {
  tier: string | null;
  onUpgrade: () => void;
  currentPlan: ReactNode;
  usage: ReactNode;
  billingDetails: ReactNode;
};

export default function BillingSection({
  tier,
  onUpgrade,
  currentPlan,
  usage,
  billingDetails,
}: BillingSectionProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
        Billing &amp; Plan
      </h3>
      <p className="mt-1 pr-8 text-sm text-slate-500 dark:text-slate-400">
        Manage your plan, usage, and billing details.
      </p>
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

      {!tier ? (
        <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : (
        <div className="space-y-6 pt-5">
          {tier === "free" ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 pr-6">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Omni Free
                </p>
                <p className="mt-1 pr-4 text-xs text-slate-500 dark:text-slate-400">
                  Essential tools for everyday tasks
                </p>
              </div>
              <button
                type="button"
                onClick={onUpgrade}
                className="flex-shrink-0 rounded-full border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-500 hover:bg-violet-50 dark:border-purple-400/40 dark:text-purple-300 dark:hover:bg-purple-400/10"
              >
                Upgrade
              </button>
            </div>
          ) : (
            currentPlan
          )}

          {usage}

          {tier !== "free" && billingDetails}
        </div>
      )}
    </div>
  );
}
