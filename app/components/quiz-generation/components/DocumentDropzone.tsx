"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import FieldError from "@/app/components/shared/generation/components/FieldError";
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE_LABEL } from "@/lib/quiz/documentRules";

type DocumentDropzoneProps = {
  label: string;
  file: File | null;
  error?: string;
  isProcessing: boolean;
  onFileChange: (file: File | null) => void;
};

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Required single-file PDF/DOCX picker for upload Generation Sources. */
export default function DocumentDropzone({
  label,
  file,
  error,
  isProcessing,
  onFileChange,
}: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const browse = () => inputRef.current?.click();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  const borderClasses = error
    ? "border-red-400 dark:border-red-500"
    : isDragging
      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
      : "border-slate-300 dark:border-slate-600 hover:border-violet-400";

  return (
    <div className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <FileText size={16} />
        {label} <span className="text-red-500">*</span>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        disabled={isProcessing}
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) onFileChange(chosen);
          e.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-disabled={isProcessing}
        aria-label={file ? `Replace ${file.name}` : `${label}: drop a PDF or DOCX, or click to browse`}
        onClick={() => !isProcessing && browse()}
        onKeyDown={(e) => {
          if (!isProcessing && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            browse();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-all ${borderClasses} ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {file ? (
          <div className="flex w-full items-center gap-3 text-left">
            <FileText size={24} className="shrink-0 text-violet-600 dark:text-violet-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatSize(file.size)} · Click or drop a file to replace
              </p>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              aria-label={`Remove ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700 disabled:cursor-not-allowed"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-violet-600 dark:text-violet-400">
                Click to browse
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-slate-500">PDF or DOCX, up to {MAX_DOCUMENT_SIZE_LABEL}</p>
          </>
        )}
      </div>

      {error && <FieldError message={error} />}
    </div>
  );
}
