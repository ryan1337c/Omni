import type { ComponentType, SVGProps } from 'react';

type ControlButtonProps = {
  label: string;
  /** A react-icons or lucide-react icon. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  tone?: 'default' | 'danger';
};

/** Small icon button for the editor's hover controls. Lives outside the text, so it never reaches the PDF. */
export default function ControlButton({ label, icon: Icon, onClick, tone = 'default' }: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center rounded bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 ${
        tone === 'danger' ? 'hover:text-red-500' : 'hover:text-violet-600'
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden />
    </button>
  );
}
