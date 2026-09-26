"use client";

import { ChevronLeft, LayoutList } from "lucide-react";

type LibraryBreadcrumbProps = {
  showBack: boolean;
  backTargetName: string;
  onGoBack: () => void;
};

export default function LibraryBreadcrumb({
  showBack,
  backTargetName,
  onGoBack,
}: LibraryBreadcrumbProps) {
  return (
    <div className="h-6 flex items-center">
      {showBack ? (
        <button
          onClick={onGoBack}
          className="group flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:opacity-70 transition-all"
        >
          <ChevronLeft
            size={14}
            strokeWidth={3}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to {backTargetName}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          <LayoutList size={12} /> Documents
        </div>
      )}
    </div>
  );
}
