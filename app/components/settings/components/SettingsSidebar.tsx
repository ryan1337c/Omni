"use client";

import { X } from "lucide-react";

import { sections } from "../constants";
import type { SettingsSection } from "../types";

type SettingsSidebarProps = {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
  onClose: () => void;
};

export default function SettingsSidebar({
  activeSection,
  onSelectSection,
  onClose,
}: SettingsSidebarProps) {
  return (
    <aside className="w-full flex-shrink-0 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:w-60 sm:border-b-0 sm:border-r">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h2
          id="settings-title"
          className="font-semibold text-slate-900 dark:text-white"
        >
          Settings
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={17} />
        </button>
      </div>

      <nav
        aria-label="Settings sections"
        className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-0 sm:space-y-1"
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectSection(id)}
              className={`flex flex-shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors sm:w-full ${
                isActive
                  ? "bg-violet-100 text-violet-800 dark:bg-purple-400/15 dark:text-purple-200"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
