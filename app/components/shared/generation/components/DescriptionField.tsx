"use client";

import { MAX_DESCRIPTION_LENGTH } from "@/lib/inputLimits";

import { INPUT_BASE_CLASSES } from "../constants";
import FieldError from "./FieldError";

type DescriptionFieldProps = {
  placeholder: string;
  value: string;
  error?: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
};

export default function DescriptionField({
  placeholder,
  value,
  error,
  isProcessing,
  onChange,
}: DescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        Description
        <span className="text-xs font-normal text-slate-400 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          Optional
        </span>
      </label>
      <textarea
        disabled={isProcessing}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={MAX_DESCRIPTION_LENGTH}
        className={`${INPUT_BASE_CLASSES} outline-none border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-btnDark focus:ring-1 focus:ring-slate-400 dark:focus:ring-btnDark resize-none`}
      />
      <p className="mt-1 text-right text-xs text-slate-400">
        {value.length}/{MAX_DESCRIPTION_LENGTH}
      </p>
      {error && <FieldError message={error} />}
    </div>
  );
}
