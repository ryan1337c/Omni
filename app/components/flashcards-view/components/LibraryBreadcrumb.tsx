"use client";

import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, LayoutList } from "lucide-react";

import type { FlashcardItem } from "../types";
import { libraryItemKey } from "../utils";

type LibraryBreadcrumbProps = {
  path: FlashcardItem[];
  onNavigate: (index: number) => void; // -1 = Documents (root)
};

function Crumb({
  dropId,
  folder,
  label,
  isCurrent,
  onClick,
}: {
  dropId: string;
  folder: FlashcardItem | null; // null for root
  label: React.ReactNode;
  isCurrent: boolean;
  onClick: () => void;
}) {
  // You can't drop into the folder you're already in, so disable it
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    disabled: isCurrent,
    data: folder ? { item: folder } : undefined,
  });

  if (isCurrent) {
    return <span className="text-slate-400">{label}</span>;
  }

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded-md text-violet-600 dark:text-violet-400 hover:opacity-70 transition-all ${
        isOver ? "ring-2 ring-violet-500 dark:ring-violet-400 bg-violet-50 dark:bg-violet-900/20" : ""
      }`}
    >
      {label}
    </button>
  );
}

export default function LibraryBreadcrumb({ path, onNavigate }: LibraryBreadcrumbProps) {
  return (
    <nav className="min-h-8 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-bold uppercase tracking-widest">
      <Crumb
        dropId="root"
        folder={null}
        isCurrent={path.length === 0}
        onClick={() => onNavigate(-1)}
        label={
          <span className="flex items-center gap-2">
            <LayoutList size={14} /> Documents
          </span>
        }
      />
      {path.map((folder, index) => (
        <span key={libraryItemKey(folder)} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-slate-400" />
          <Crumb
            dropId={`crumb-${libraryItemKey(folder)}`}
            folder={folder}
            isCurrent={index === path.length - 1}
            onClick={() => onNavigate(index)}
            label={
              <span className="inline-block max-w-[12rem] truncate align-bottom">{folder.title}</span>
            }
          />
        </span>
      ))}
    </nav>
  );
}