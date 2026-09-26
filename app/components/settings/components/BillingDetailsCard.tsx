"use client";

type BillingDetailsCardProps = {
  isPortalLoading: boolean;
  portalError: string;
  onOpenBillingPortal: () => void;
};

export default function BillingDetailsCard({
  isPortalLoading,
  portalError,
  onOpenBillingPortal,
}: BillingDetailsCardProps) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Billing details
      </h4>
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Payment methods and invoices
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage your subscription, update your card, or view receipts securely through
          Stripe.
        </p>

        <button
          type="button"
          onClick={onOpenBillingPortal}
          disabled={isPortalLoading}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10"
        >
          {isPortalLoading ? "Opening..." : "Manage billing"}
        </button>

        {portalError && (
          <p
            role="alert"
            className="mt-3 text-xs text-red-600 dark:text-red-400"
          >
            {portalError}
          </p>
        )}
      </div>
    </section>
  );
}
