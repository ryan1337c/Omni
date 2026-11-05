"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { figureNumberLabel, type StoredFigure } from "@/lib/quiz/figureRules";

type FigureGridProps = {
  figures: StoredFigure[];
};

/** A question's Figures: one at full width, two side by side, three or four in a 2×2 grid. */
export default function FigureGrid({ figures }: FigureGridProps) {
  const [enlarged, setEnlarged] = useState<number | null>(null);

  useEffect(() => {
    if (enlarged === null) return;
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [enlarged]);

  if (figures.length === 0) return null;

  const numberLabel = (index: number) => figureNumberLabel(index, figures.length);

  return (
    <>
      <div
        className={`grid gap-3 ${figures.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        {figures.map((figure, index) => (
          <figure key={figure.path} className="space-y-1.5">
            <button
              type="button"
              onClick={() => setEnlarged(index)}
              className="w-full flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 hover:border-violet-300 dark:hover:border-btnDark transition-colors cursor-zoom-in"
              title="View full size"
            >
              <img
                src={figure.url}
                alt={numberLabel(index) ?? "Figure"}
                className={`w-full object-contain ${figures.length === 1 ? "max-h-80" : "max-h-56"}`}
              />
            </button>
            {numberLabel(index) && (
              <figcaption className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                {numberLabel(index)}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {enlarged !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 animate-in fade-in duration-200 cursor-zoom-out"
            onClick={() => setEnlarged(null)}
          >
            <button
              type="button"
              onClick={() => setEnlarged(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
            <figure className="flex flex-col items-center gap-2 max-h-full max-w-full">
              <img
                src={figures[enlarged].url}
                alt={numberLabel(enlarged) ?? "Figure"}
                className="max-h-[85vh] max-w-full object-contain rounded-lg bg-white"
              />
              {numberLabel(enlarged) && (
                <figcaption className="text-sm font-semibold text-white">
                  {numberLabel(enlarged)}
                </figcaption>
              )}
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}
