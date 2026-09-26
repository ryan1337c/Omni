"use client";

import { ArrowRight, Check, LockKeyhole, Sparkles, X } from "lucide-react";

import type { CheckoutPlan } from "@/app/components/settings/types";

import { premiumFeatureLabels } from "../constants";
import type { PremiumFeature } from "../types";

type PremiumPaywallModalProps = {
  feature: PremiumFeature;
  isCheckoutLoading: boolean;
  checkoutError: string;
  onClose: () => void;
  onPlanSelection: (plan: CheckoutPlan) => void;
};

export default function PremiumPaywallModal({
  feature,
  isCheckoutLoading,
  checkoutError,
  onClose,
  onPlanSelection,
}: PremiumPaywallModalProps) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/45 backdrop-blur-md animate-fade-in">
      <div
        className="flex min-h-full items-center justify-center px-4 py-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-title"
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-2xl shadow-violet-950/20 dark:border-purple-400/20 dark:bg-slate-900 dark:shadow-black/50"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade dialog"
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />

          <div className="px-7 pb-7 pt-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
              <LockKeyhole size={29} strokeWidth={2.2} />
            </div>

            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-purple-400/10 dark:text-purple-300">
              <Sparkles size={13} />
              Pro feature
            </p>
            <h2
              id="upgrade-title"
              className="mt-3 text-2xl font-bold text-slate-900 dark:text-white"
            >
              Unlock {premiumFeatureLabels[feature]}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Upgrade to Pro and get the complete Omni toolkit for work, study,
              and everything in between.
            </p>

            <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/70 p-4 text-left dark:border-purple-400/20 dark:bg-purple-400/[0.06]">
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Everything in Pro
              </p>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                {[
                  "Resume tailoring",
                  "Quiz generation",
                  "Flashcard generation",
                  "4× higher usage limit than Free",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-white dark:bg-purple-500">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onPlanSelection("pro_monthly")}
                disabled={isCheckoutLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
              >
                {isCheckoutLoading ? "Redirecting..." : "Subscribe monthly"}
                {!isCheckoutLoading && <ArrowRight size={17} />}
              </button>

              <button
                type="button"
                onClick={() => onPlanSelection("pro_yearly")}
                disabled={isCheckoutLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 font-semibold text-violet-700 transition hover:-translate-y-0.5 hover:border-violet-500 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-400/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-400/10 dark:focus:ring-offset-slate-900"
              >
                {isCheckoutLoading ? "Redirecting..." : "Subscribe yearly"}
                {!isCheckoutLoading && <ArrowRight size={17} />}
              </button>
            </div>

            {checkoutError && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600 dark:text-red-400"
              >
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              disabled
              aria-label="Enterprise subscriptions unavailable"
              className="mt-4"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
