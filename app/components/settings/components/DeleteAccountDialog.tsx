"use client";

import { AlertTriangle, X } from "lucide-react";

import DialogOverlay from "./DialogOverlay";

type Confirmation = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

type DeleteAccountDialogProps = {
  confirmations: Confirmation[];
  isDeletingAccount: boolean;
  deleteAccountError: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeleteAccountDialog({
  confirmations,
  isDeletingAccount,
  deleteAccountError,
  onConfirm,
  onClose,
}: DeleteAccountDialogProps) {
  const isFullyConfirmed = confirmations.every(({ checked }) => checked);

  return (
    <DialogOverlay>
      <div className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-400/20 dark:bg-slate-900">
        <div className="h-1.5 flex-shrink-0 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close delete account dialog"
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto p-6 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/5">
            <AlertTriangle size={28} strokeWidth={2} />
          </div>
          <h3 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
            Delete your account?
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
            This permanently removes your Omni account and cannot be
            reversed.
          </p>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-400/20 dark:bg-red-400/[0.06]">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
              Before you continue
            </p>
            {confirmations.map(({ checked, onChange, label }) => (
              <label
                key={label}
                className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onChange(event.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red-600"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {deleteAccountError && (
            <p
              role="alert"
              className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
            >
              {deleteAccountError}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeletingAccount}
              className="order-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10 sm:order-1"
            >
              Keep my account
            </button>
            <button
              type="button"
              disabled={!isFullyConfirmed || isDeletingAccount}
              onClick={onConfirm}
              className="order-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none dark:disabled:bg-red-950 dark:disabled:text-red-500 sm:order-2"
            >
              {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
            </button>
          </div>
        </div>
      </div>
    </DialogOverlay>
  );
}
