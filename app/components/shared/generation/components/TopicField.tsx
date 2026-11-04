"use client";

import { AlignLeft } from "lucide-react";

import { INPUT_BASE_CLASSES, TOPIC_LIMIT } from "../constants";
import { getBorderClasses } from "../utils";
import FieldError from "./FieldError";

type TopicFieldProps = {
  label: string;
  placeholder: string;
  rows: number;
  value: string;
  error?: string;
  required?: boolean;
  isProcessing: boolean;
  onChange: (value: string) => void;
};

export default function TopicField({
  label,
  placeholder,
  rows,
  value,
  error,
  required = true,
  isProcessing,
  onChange,
}: TopicFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <AlignLeft size={16} />
        {label}{" "}
        {required ? (
          <span className="text-red-500">*</span>
        ) : (
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        )}
      </label>
      <span
        className={`text-xs font-medium ${value.length >= TOPIC_LIMIT ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}
      >
        {value.length}/{TOPIC_LIMIT}
      </span>
      <textarea
        disabled={isProcessing}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={TOPIC_LIMIT}
        className={`${INPUT_BASE_CLASSES} outline-none ${getBorderClasses(!!error)}`}
      />
      {error && <FieldError message={error} />}
    </div>
  );
}
