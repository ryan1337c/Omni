"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

import DialogOverlay from "./DialogOverlay";

type EditNameDialogProps = {
  nameDraft: string;
  onNameDraftChange: (value: string) => void;
  isSavingName: boolean;
  nameError: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function EditNameDialog({
  nameDraft,
  onNameDraftChange,
  isSavingName,
  nameError,
  onSubmit,
  onClose,
}: EditNameDialogProps) {
  return (
    <DialogOverlay>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Edit name
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingName}
            aria-label="Close name editor"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <label
          htmlFor="account-name"
          className="mt-6 block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Name
        </label>
        <input
          id="account-name"
          type="text"
          required
          value={nameDraft}
          onChange={(event) => onNameDraftChange(event.target.value)}
          disabled={isSavingName}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        {nameError && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {nameError}
          </p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingName}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSavingName || !nameDraft.trim()}
            className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            {isSavingName ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </DialogOverlay>
  );
}
