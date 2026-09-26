"use client";

import { FileText, X } from "lucide-react";

import type { FileWithPreview } from "../types";

type AttachmentListProps = {
  files: FileWithPreview[];
  onFileDelete: (index: number) => void;
};

export function AttachmentList({ files, onFileDelete }: AttachmentListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 p-2 border-t border-b border-gray-200 dark:border-slate-700">
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg pl-2 pr-1 py-1 text-sm"
          >
            {file.type.startsWith("image/") ? (
              <img
                src={file.preview}
                alt={file.name}
                className="w-8 h-8 mr-2 object-cover rounded"
              />
            ) : (
              <FileText className="w-4 h-4 mr-2 text-slate-600 dark:text-gray-300 flex-shrink-0" />
            )}
            <span className="truncate max-w-xs text-slate-800 dark:text-gray-200">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => onFileDelete(index)}
              className="ml-2 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
              aria-label={`Remove ${file.name}`}
            >
              <X className="w-3 h-3 text-slate-700 dark:text-gray-300" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
