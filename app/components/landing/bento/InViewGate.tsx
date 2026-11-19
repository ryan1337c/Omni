'use client';
import { useEffect, useRef, type ReactNode } from 'react';

// Sets data-inview="true|false" on its wrapper while it is on screen. It writes the attribute
// straight to the DOM, so scrolling never re-renders React. CSS (see .bento-gate in
// globals.css) uses it to pause animations that are off screen.
const InViewGate = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.dataset.inview = entry.isIntersecting ? 'true' : 'false';
      },
      { rootMargin: '60px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-inview="false" className={`bento-gate ${className}`}>
      {children}
    </div>
  );
};

export default InViewGate;
