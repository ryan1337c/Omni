"use client";

import { AlertTriangle, X } from "lucide-react";

import DialogOverlay from "./DialogOverlay";

type CancelSubscriptionDialogProps = {
  isCancelling: boolean;
  cancellationError: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function CancelSubscriptionDialog({
  isCancelling,
  cancellationError,
  onConfirm,
  onClose,
}: CancelSubscriptionDialogProps) {
  return (
    <DialogOverlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCancelling) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          disabled={isCancelling}
          aria-label="Close cancel subscription dialog"
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto p-6 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-8 ring-amber-50 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/5">
            <AlertTriangle size={28} strokeWidth={2} />
          </div>
          <h3 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
            Cancel subscription?
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cancel your subscription at the end of the current billing
            period?
          </p>

          {cancellationError && (
            <p
              role="alert"
              className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
            >
              {cancellationError}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCancelling}
              className="order-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10 sm:order-1"
            >
              Keep subscription
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isCancelling}
              className="order-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none dark:disabled:bg-red-950 dark:disabled:text-red-500 sm:order-2"
            >
              {isCancelling ? "Cancelling..." : "Yes, cancel"}
            </button>
          </div>
        </div>
      </div>
    </DialogOverlay>
  );
}
