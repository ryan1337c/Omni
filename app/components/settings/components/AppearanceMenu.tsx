"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

import { themes } from "../constants";

type AppearanceMenuProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isMounted: boolean;
  menuRef: RefObject<HTMLDivElement>;
};

export default function AppearanceMenu({
  isOpen,
  setIsOpen,
  isMounted,
  menuRef,
}: AppearanceMenuProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium capitalize text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
      >
        {isMounted ? theme ?? "system" : "System"}
        <ChevronDown
          size={15}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Appearance"
          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        >
          {themes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={theme === id}
              onClick={() => {
                setTheme(id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                theme === id
                  ? "bg-violet-50 font-semibold text-violet-700 dark:bg-purple-400/10 dark:text-purple-300"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {label}
              {theme === id && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
