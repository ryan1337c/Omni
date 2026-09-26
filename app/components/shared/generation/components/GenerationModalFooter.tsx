"use client";

type GenerationModalFooterProps = {
  isProcessing: boolean;
  editMode: boolean;
  generateLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function GenerationModalFooter({
  isProcessing,
  editMode,
  generateLabel,
  onCancel,
  onSubmit,
}: GenerationModalFooterProps) {
  return (
    <>
      <button
        disabled={isProcessing}
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={isProcessing}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
      >
        {isProcessing
          ? editMode
            ? "Saving..."
            : "Processing..."
          : editMode
            ? "Save Changes"
            : generateLabel}
      </button>
    </>
  );
}
