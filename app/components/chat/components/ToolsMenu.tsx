"use client";

import { Check } from "lucide-react";

import { TOOLS } from "../constants";

type ToolsMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  isProcessing: boolean;
};

export function ToolsMenu({
  isOpen,
  onToggle,
  selectedTool,
  onToolSelect,
  isProcessing,
}: ToolsMenuProps) {
  return (
    <div className="relative text-left group flex items-center">
      <button
        onClick={onToggle}
        disabled={isProcessing}
        className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
      >
        <svg className=" w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
          <path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z" />
        </svg>
      </button>
      {!isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          Search and Tools
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      {isOpen && (
        <div className="absolute bottom-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1">
          {TOOLS.map((tool, index) => (
            <button
              key={index}
              onClick={() => onToolSelect(tool.id)}
              className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {tool.name}
                </div>
              </div>
              {selectedTool === tool.id && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
