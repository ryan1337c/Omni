"use client";
import type { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

// Words with a hand-drawn underline that "draws" itself left to right
// the first time they scroll into view (styles: .pencil-line in globals.css).
const PencilUnderline = ({
  children,
  className = 'font-bold text-indigo-500 dark:text-indigo-400',
  straight = false,
}: {
  children: ReactNode;
  className?: string;
  /** Draw a clean straight line instead of the hand-drawn wobble */
  straight?: boolean;
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: straight ? 0 : 0.6 });

  return (
    <strong ref={ref} className={`relative inline-block whitespace-nowrap ${className}`}>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 220 14"
        preserveAspectRatio="none"
        className="absolute left-[-2%] -bottom-2 w-[104%] h-[0.6em] max-h-4 overflow-visible"
      >
        <path
          d={straight ? 'M3 7 L217 7' : 'M3 9.5 C 30 6, 60 4.5, 95 6.5 S 160 9, 190 5.5 S 212 4, 217 6'}
          pathLength={1}
          style={straight ? { transitionDelay: '0s' } : undefined}
          className={`pencil-line ${inView ? 'pencil-line-drawn' : ''}`}
        />
      </svg>
    </strong>
  );
};

export default PencilUnderline;