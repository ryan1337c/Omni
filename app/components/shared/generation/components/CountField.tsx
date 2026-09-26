"use client";

import { ListChecks } from "lucide-react";

import { INPUT_BASE_CLASSES } from "../constants";

type CountFieldProps = {
  label: string;
  hint: string;
  min: number;
  max: number;
  value: number | string;
  isProcessing: boolean;
  hintClassName?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export default function CountField({
  label,
  hint,
  min,
  max,
  value,
  isProcessing,
  hintClassName = "text-slate-400 dark:text-slate-500 text-xs font-normal ml-auto",
  onChange,
  onBlur,
}: CountFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <ListChecks size={16} />
        {label}
        <span className={hintClassName}>{hint}</span>
      </label>
      <input
        disabled={isProcessing}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${INPUT_BASE_CLASSES} border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 outline-none`}
      />
    </div>
  );
}
