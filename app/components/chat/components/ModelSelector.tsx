"use client";

import { useState } from "react";
import { Ban, Check, ChevronDown } from "lucide-react";

import { MODELS } from "../constants";
import type { ChatModel } from "../types";
import { tierDotColor } from "../utils";

type ModelSelectorProps = {
  isOpen: boolean;
  onToggle: () => void;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  selectedTool: string;
};

export function ModelSelector({
  isOpen,
  onToggle,
  selectedModel,
  onModelSelect,
  selectedTool,
}: ModelSelectorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const selectedModelData = MODELS.find((model) => model.id === selectedModel);
  const modelDisabledForImage =
    selectedTool === "image" &&
    (selectedModelData?.id === "deep-seek" ||
      selectedModelData?.id === "claude-sonnet-4");

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={onToggle}
        className="inline-flex items-center justify-between w-36 sm:w-40 md:w-64 px-3 sm:px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDotColor(selectedModelData?.tier ?? "")}`}
          />
          <span className="text-left truncate">{selectedModelData?.name}</span>
        </div>
        {modelDisabledForImage ? (
          <div
            className="relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Ban className="w-4 h-4 transition-transform duration-200 text-red-500" />
            <div
              className={`absolute bottom-full right-0 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-10 ${showTooltip ? "opacity-100" : "opacity-0 pointer-events-none "} transition-opacity duration-75`}
            >
              Model selection disabled for image tool
              <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        ) : (
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 bottom-full mb-2 w-56 sm:w-64 md:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col max-h-[60vh]">
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {MODELS.map((model: ChatModel) => (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className="group flex items-center w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                <div className="flex items-center flex-1">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${tierDotColor(model.tier)}`}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {model.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                      {model.description}
                    </div>
                  </div>
                </div>
                {selectedModel === model.id && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 flex-shrink-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Choose the model that best fits your needs
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
