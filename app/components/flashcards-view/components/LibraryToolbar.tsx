"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  ChevronDown,
  Clock,
  Files,
  Filter,
  Folder,
  LayoutList,
} from "lucide-react";
import type { Ref } from "react";

import type { FilterType, SortOption, SortOrder } from "../types";

type LibraryToolbarProps = {
  filterRef: Ref<HTMLDivElement>;
  sortRef: Ref<HTMLDivElement>;
  filterType: FilterType;
  setFilterType: (value: FilterType) => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  sortOrder: SortOrder;
  setSortOrder: (value: SortOrder) => void;
  isFilterMenuOpen: boolean;
  setIsFilterMenuOpen: (open: boolean) => void;
  isSortMenuOpen: boolean;
  setIsSortMenuOpen: (open: boolean) => void;
};

export default function LibraryToolbar({
  filterRef,
  sortRef,
  filterType,
  setFilterType,
  sortOption,
  setSortOption,
  sortOrder,
  setSortOrder,
  isFilterMenuOpen,
  setIsFilterMenuOpen,
  isSortMenuOpen,
  setIsSortMenuOpen,
}: LibraryToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
        >
          <Filter size={16} />
          <span>
            {filterType === "all" && "All Items"}
            {filterType === "folder" && "Folders Only"}
            {filterType === "deck" && "Flashcards Only"}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isFilterMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isFilterMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                setFilterType("all");
                setIsFilterMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === "all" ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-slate-600 dark:text-slate-300"}`}
            >
              <LayoutList size={14} /> All Items
            </button>
            <button
              onClick={() => {
                setFilterType("folder");
                setIsFilterMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === "folder" ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-slate-600 dark:text-slate-300"}`}
            >
              <Folder size={14} /> Folders Only
            </button>
            <button
              onClick={() => {
                setFilterType("deck");
                setIsFilterMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === "deck" ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-slate-600 dark:text-slate-300"}`}
            >
              <Files size={14} /> Flashcards Only
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:block">
          Sort By
        </span>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
          >
            {sortOption === "last_updated" ? (
              <Clock size={16} />
            ) : (
              <Calendar size={16} />
            )}
            <span>
              {sortOption === "last_updated" ? "Last Updated" : "Created Date"}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isSortMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isSortMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setSortOption("last_updated");
                  setIsSortMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${sortOption === "last_updated" ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-slate-600 dark:text-slate-300"}`}
              >
                <Clock size={14} /> Last Updated
              </button>
              <button
                onClick={() => {
                  setSortOption("created_at");
                  setIsSortMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${sortOption === "created_at" ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-slate-600 dark:text-slate-300"}`}
              >
                <Calendar size={14} /> Created Date
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() =>
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
          }
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
          title={
            sortOrder === "asc"
              ? "Ascending (Oldest First)"
              : "Descending (Newest First)"
          }
        >
          {sortOrder === "asc" ? (
            <ArrowUpAZ size={18} />
          ) : (
            <ArrowDownAZ size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
