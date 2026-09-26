"use client";

import { INPUT_BASE_CLASSES } from "../constants";
import { getBorderClasses } from "../utils";
import FieldError from "./FieldError";

type TitleFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
};

export default function TitleField({
  label,
  placeholder,
  value,
  error,
  isProcessing,
  onChange,
}: TitleFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        disabled={isProcessing}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_BASE_CLASSES} outline-none ${getBorderClasses(!!error)}`}
      />
      {error && <FieldError message={error} />}
    </div>
  );
}
