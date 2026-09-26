"use client";

import { AlertTriangle, Eraser, Layers, Plus, Trash2, Type } from "lucide-react";

import {
  INPUT_BASE_CLASSES,
  getBorderClasses,
} from "@/app/components/shared/generation";

import type { ManualCard } from "../types";

type ManualCardsEditorProps = {
  cards: ManualCard[];
  manualError?: string;
  isProcessing: boolean;
  onClearAll: () => void;
  onAddCard: () => void;
  onDeleteCard: (id: string | number) => void;
  onUpdateCard: (
    id: string | number,
    field: "front" | "back",
    value: string,
  ) => void;
};

export default function ManualCardsEditor({
  cards,
  manualError,
  isProcessing,
  onClearAll,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
}: ManualCardsEditorProps) {
  return (
    <div className="space-y-6 animate-fade-in-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Cards ({cards.length})
        </h3>
        <button
          onClick={onClearAll}
          disabled={isProcessing}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser size={14} /> Clear All
        </button>
      </div>

      {manualError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-300 text-sm animate-fade-in-sm">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <p>{manualError}</p>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                {index + 1}
              </span>
              <button
                onClick={() => onDeleteCard(card.id)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  <Layers size={12} /> Front
                </label>
                <textarea
                  disabled={isProcessing}
                  placeholder="Term or Question..."
                  value={card.front}
                  onChange={(e) => onUpdateCard(card.id, "front", e.target.value)}
                  rows={2}
                  className={`${INPUT_BASE_CLASSES} bg-white dark:bg-slate-800 outline-none resize-none ${getBorderClasses(!!manualError && !card.front.trim())}`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  <Type size={12} /> Back
                </label>
                <textarea
                  disabled={isProcessing}
                  placeholder="Definition or Answer..."
                  value={card.back}
                  onChange={(e) => onUpdateCard(card.id, "back", e.target.value)}
                  rows={2}
                  className={`${INPUT_BASE_CLASSES} bg-white dark:bg-slate-800 outline-none resize-none ${getBorderClasses(!!manualError && !card.back.trim())}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddCard}
        disabled={isProcessing}
        className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium hover:border-violet-300 dark:hover:border-slate-500 hover:text-violet-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} />
        Add Card
      </button>
    </div>
  );
}
