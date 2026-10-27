import { LuAsterisk } from 'react-icons/lu';

/** The Required marker: one accent color on every band, so it stands out on any chip. */
export default function RequiredBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-white ring-2 ring-white dark:bg-violet-400 dark:ring-slate-800 ${className}`}
      aria-hidden
    >
      <LuAsterisk className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}
