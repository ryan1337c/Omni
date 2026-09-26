"use client";

type NavigatorLegendProps = {
  isSubmitted: boolean;
  variant?: "full" | "compact";
};

export default function NavigatorLegend({
  isSubmitted,
  variant = "full",
}: NavigatorLegendProps) {
  if (isSubmitted) {
    return (
      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-600"></div>
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-600"></div>
          <span>Wrong</span>
        </div>
        {variant === "full" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600"></div>
            <span>Unanswered</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm bg-violet-600"></div>
        <span>Answered</span>
      </div>
      {variant === "full" && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border-2 border-violet-600"></div>
          <span>Current</span>
        </div>
      )}
    </div>
  );
}
