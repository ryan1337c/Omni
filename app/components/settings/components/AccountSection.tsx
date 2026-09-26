"use client";

import { ChevronRight } from "lucide-react";

type AccountSectionProps = {
  isAccountLoading: boolean;
  accountName: string;
  accountEmail: string;
  onEditName: () => void;
  onDeleteAccount: () => void;
};

export default function AccountSection({
  isAccountLoading,
  accountName,
  accountEmail,
  onEditName,
  onDeleteAccount,
}: AccountSectionProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
        Account
      </h3>
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

      {isAccountLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          <button
            type="button"
            onClick={onEditName}
            className="flex min-h-14 w-full items-center justify-between gap-8 py-3 text-left transition-colors hover:text-violet-700 dark:hover:text-purple-300"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Name
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                {accountName}
              </span>
              <ChevronRight size={16} className="flex-shrink-0 text-slate-400" />
            </span>
          </button>

          <div className="flex min-h-14 items-center justify-between gap-8 py-3">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Email
            </span>
            <span className="truncate text-right text-sm text-slate-600 dark:text-slate-300">
              {accountEmail}
            </span>
          </div>

          <div className="flex min-h-16 items-center justify-between gap-6 py-3">
            <div className="pr-6">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Delete account
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Permanently delete your account and data.
              </p>
            </div>
            <button
              type="button"
              onClick={onDeleteAccount}
              className="flex-shrink-0 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-400/60 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
