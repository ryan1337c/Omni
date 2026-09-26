"use client";

import {
  Calendar,
  Clock,
  Files,
  Folder,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { MouseEvent } from "react";

import { timeAgo } from "@/lib/utils";

import type { FlashcardItem } from "../types";

type LibraryItemCardProps = {
  item: FlashcardItem;
  isMenuOpen: boolean;
  isNewMenuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  onToggleStar: (item: FlashcardItem, e: MouseEvent) => void;
  onRename: (item: FlashcardItem) => void;
  onEditDeck: (item: FlashcardItem) => void;
  onDelete: (item: FlashcardItem) => void;
  onFolderClick: (folder: FlashcardItem) => void;
  onDeckClick: (deck: FlashcardItem) => void;
};

function StarButton({
  item,
  onToggleStar,
}: {
  item: FlashcardItem;
  onToggleStar: (item: FlashcardItem, e: MouseEvent) => void;
}) {
  return (
    <button
      onClick={(e) => onToggleStar(item, e)}
      className="absolute top-24 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-20 group/star hidden lg:block"
      title={item.isStarred ? "Unstar" : "Star"}
    >
      <Star
        size={20}
        strokeWidth={2.5}
        className={`transition-all duration-300 ${
          item.isStarred
            ? "fill-yellow-400 text-yellow-400"
            : "text-slate-400 dark:text-slate-500 group-hover/star:text-yellow-400"
        }`}
      />
    </button>
  );
}

function MoreMenu({
  item,
  isMenuOpen,
  onToggleMenu,
  onToggleStar,
  onRename,
  onEditDeck,
  onDelete,
}: Pick<
  LibraryItemCardProps,
  | "item"
  | "isMenuOpen"
  | "onToggleMenu"
  | "onToggleStar"
  | "onRename"
  | "onEditDeck"
  | "onDelete"
>) {
  return (
    <div className="relative" id={`menu-container-${item.id}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu(!isMenuOpen);
        }}
        className={`relative group/more p-1.5 rounded-lg transition-colors ${
          isMenuOpen
            ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
        }`}
      >
        <MoreVertical size={18} />
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={(e) => {
              onToggleStar(item, e);
              onToggleMenu(false);
            }}
            className="flex lg:hidden items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
          >
            <Star
              size={12}
              className={item.isStarred ? "fill-yellow-400 text-yellow-400" : ""}
            />
            {item.isStarred ? "Unstar" : "Star"}
          </button>
          {item.type === "folder" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(item);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
            >
              <Pencil size={12} /> Rename
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditDeck(item);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
            >
              <Pencil size={12} /> Edit
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function LibraryItemCard(props: LibraryItemCardProps) {
  const {
    item,
    isMenuOpen,
    isNewMenuOpen,
    onToggleStar,
    onFolderClick,
    onDeckClick,
  } = props;

  const hoverClass =
    isMenuOpen || isNewMenuOpen ? "" : "hover:-translate-y-1 hover:drop-shadow-lg";
  const zIndexClass = isMenuOpen ? "z-40" : "z-0";

  if (item.type === "folder") {
    return (
      <div
        key={item.id}
        onClick={() => onFolderClick(item)}
        className={`group relative h-52 cursor-pointer transition-transform duration-300 ${hoverClass} ${zIndexClass}`}
      >
        <div className="absolute top-0 left-0 w-28 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-t-xl border-t border-l border-r border-blue-200 dark:border-blue-700/50"></div>
        <div className="absolute top-4 inset-x-0 bottom-0 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-700/50 rounded-b-xl rounded-tr-xl p-5 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Folder size={20} />
            </div>
            <MoreMenu {...props} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {item.count} items
            </p>
          </div>
          <div className="pt-3 mt-auto border-t border-blue-100 dark:border-slate-700/50 text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} /> Created {timeAgo(item.created_at ?? "")}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> Updated {timeAgo(item.last_updated ?? "")}
            </div>
          </div>
          <StarButton item={item} onToggleStar={onToggleStar} />
        </div>
      </div>
    );
  }

  return (
    <div
      key={item.id}
      onClick={() => onDeckClick(item)}
      className={`group relative h-52 cursor-pointer transition-transform duration-300 ${hoverClass} ${zIndexClass}`}
    >
      <div className="absolute top-2 left-2 right-0 bottom-0 bg-slate-200 dark:bg-slate-700 rounded-2xl border border-slate-300 dark:border-slate-600 z-0"></div>
      <div className="absolute top-0 left-0 right-2 bottom-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-sm z-10">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
            <Files size={20} />
          </div>
          <MoreMenu {...props} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
              {item.count} Cards
            </span>
          </div>
        </div>
        <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} /> Created {timeAgo(item.created_at ?? "")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} /> Updated {timeAgo(item.last_updated ?? "")}
          </div>
        </div>
        <StarButton item={item} onToggleStar={onToggleStar} />
      </div>
    </div>
  );
}
