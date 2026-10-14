import CountUp from 'react-countup';

type ScoreRingProps = {
  /** 0-100. */
  score: number;
  /** Tailwind text color class; the ring stroke uses `currentColor`. */
  colorClassName: string;
  size?: number;
  strokeWidth?: number;
};

export default function ScoreRing({ score, colorClassName, size = 96, strokeWidth = 8 }: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${clamped} out of 100`}
    >
      {/* Rotated so the progress arc starts at 12 o'clock. */}
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`${colorClassName} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>

      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums text-slate-900 dark:text-white"
        aria-hidden
      >
        {/* preserveValue animates from the previous score as the user edits. */}
        <CountUp end={clamped} duration={0.8} preserveValue />
      </span>
    </div>
  );
}
