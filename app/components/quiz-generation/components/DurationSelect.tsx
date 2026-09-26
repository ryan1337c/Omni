"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

import { INPUT_BASE_CLASSES } from "@/app/components/shared/generation/constants";

import { DURATION_OPTIONS } from "../constants";

type DurationSelectProps = {
  value: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
};

const durationTriggerClasses = `${INPUT_BASE_CLASSES} h-auto outline-none border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500`;

export default function DurationSelect({
  value,
  isProcessing,
  onChange,
}: DurationSelectProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Clock size={16} />
        Duration
      </label>
      <Select value={value} onValueChange={onChange} disabled={isProcessing}>
        <SelectTrigger className={durationTriggerClasses}>
          <SelectValue placeholder="Select duration" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 max-h-[12rem] overflow-y-auto z-[60]">
          {DURATION_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
