"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";

import type { CheckoutPlan } from "../types";
import DialogOverlay from "./DialogOverlay";

type UpgradeDialogProps = {
  isCheckoutLoading: boolean;
  checkoutError: string;
  onCheckout: (plan: CheckoutPlan) => void;
  onClose: () => void;
};

export default function UpgradeDialog({
  isCheckoutLoading,
  checkoutError,
  onCheckout,
  onClose,
}: UpgradeDialogProps) {
  return (
    <DialogOverlay
      className="z-40 bg-slate-950/55"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl dark:border-purple-400/20 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade dialog"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
        <div className="px-7 pb-7 pt-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
            <Sparkles size={25} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-purple-300">
            Omni Pro
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Choose your billing cycle
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Unlock all premium features and get four times the Free usage
            limit.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onCheckout("pro_monthly")}
              disabled={isCheckoutLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckoutLoading ? "Redirecting..." : "Subscribe monthly"}
              {!isCheckoutLoading && <ArrowRight size={16} />}
            </button>
            <button
              type="button"
              onClick={() => onCheckout("pro_yearly")}
              disabled={isCheckoutLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:-translate-y-0.5 hover:border-violet-500 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-400/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-400/10"
            >
              {isCheckoutLoading ? "Redirecting..." : "Subscribe yearly"}
              {!isCheckoutLoading && <ArrowRight size={16} />}
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
        </div>
      </div>
    </DialogOverlay>
  );
}
