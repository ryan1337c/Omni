"use client";

import { Search } from "lucide-react";

import type { FlashcardItem } from "../types";

type LibraryHeaderProps = {
  currFolder: FlashcardItem | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function LibraryHeader({
  currFolder,
  searchTerm,
  onSearchChange,
}: LibraryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          {currFolder ? currFolder.title : "Your Library"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {currFolder
            ? `Managing content inside ${currFolder.title}`
            : "Manage your decks and folders."}
        </p>
      </div>

      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search library..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent dark:focus:border-transparent transition-all shadow-sm"
        />
      </div>
    </div>
  );
}
