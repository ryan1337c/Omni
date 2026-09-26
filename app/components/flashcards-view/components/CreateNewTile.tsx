"use client";

import { AlertTriangle, Files, Folder, Plus, X } from "lucide-react";

type CreateNewTileProps = {
  isNewMenuOpen: boolean;
  setIsNewMenuOpen: (open: boolean) => void;
  isAtMaxDepth: boolean | null | undefined;
  onCreateDeck: () => void;
  onCreateFolder: () => void;
};

export default function CreateNewTile({
  isNewMenuOpen,
  setIsNewMenuOpen,
  isAtMaxDepth,
  onCreateDeck,
  onCreateFolder,
}: CreateNewTileProps) {
  return (
    <div
      className={`relative group h-52 rounded-2xl transition-all duration-200 ${
        isNewMenuOpen
          ? "bg-white dark:bg-slate-800 shadow-xl border-2 border-violet-500 dark:border-violet-500 z-40"
          : "border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 z-0"
      }`}
    >
      {!isNewMenuOpen ? (
        <button
          onClick={() => setIsNewMenuOpen(true)}
          className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-violet-600 dark:hover:text-slate-200 transition-colors"
        >
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-violet-100 dark:group-hover:bg-slate-700 transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-semibold">Create New</span>
        </button>
      ) : (
        <div className="w-full h-full flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Create
            </span>
            <button
              onClick={() => setIsNewMenuOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2 h-full justify-center">
            <button
              onClick={onCreateDeck}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all text-left group/item"
            >
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover/item:text-violet-600">
                <Files size={18} />
              </div>
              <span className="font-semibold text-sm">Flashcard Deck</span>
            </button>
            <button
              onClick={() => {
                if (!isAtMaxDepth) onCreateFolder();
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item w-full ${
                isAtMaxDepth
                  ? "bg-slate-100 dark:bg-slate-800/50 opacity-60 cursor-not-allowed"
                  : "bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              }`}
            >
              <div
                className={`p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm ${!isAtMaxDepth && "group-hover/item:text-blue-600"}`}
              >
                <Folder size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Folder</span>
                {isAtMaxDepth && (
                  <span className="text-[10px] text-red-700 dark:text-red-500 flex items-center gap-1 font-bold">
                    <AlertTriangle size={10} /> Max Depth Reached
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
