'use client';
import { useEffect, useRef, type ReactNode } from 'react';

const MAX_ACTIVE_AFTER_TOUCH_MS = 700;

// Grid wrapper that drives the hover border on every bento tile.
// One delegated listener for the whole grid: it finds the tile under the pointer (or thumb),
// writes its position as --tx / --ty (-1..1 from the centre) and marks it data-active.
// CSS (.bento-tilt-back in globals.css) shifts a gradient card behind the tile toward that
// point, so the edges nearest the pointer get thicker and the far edges disappear.
// Writes go straight to the DOM inside requestAnimationFrame, so React never re-renders.
const TiltGrid = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active: HTMLElement | null = null;
    let frame = 0;
    let touchTimer = 0;
    let last = { x: 0, y: 0 };

    const deactivate = () => {
      if (!active) return;
      active.removeAttribute('data-active');
      active.style.setProperty('--tx', '0');
      active.style.setProperty('--ty', '0');
      active = null;
    };

    const paint = () => {
      frame = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const tx = reduceMotion.matches ? 0 : clamp((last.x - (r.left + r.width / 2)) / (r.width / 2));
      const ty = reduceMotion.matches ? 0 : clamp((last.y - (r.top + r.height / 2)) / (r.height / 2));
      active.style.setProperty('--tx', tx.toFixed(3));
      active.style.setProperty('--ty', ty.toFixed(3));
      // Spotlight mask on the border card: it narrows as the pointer nears an edge, so only the
      // stretch of border closest to the pointer shows (like a card tilted hard toward that point).
      const edge = Math.max(Math.abs(tx), Math.abs(ty));
      const radius = Math.hypot(r.width, r.height) * (1 - 0.82 * Math.pow(edge, 1.4));
      active.style.setProperty('--mx', ((tx + 1) * 50).toFixed(2) + '%');
      active.style.setProperty('--my', ((ty + 1) * 50).toFixed(2) + '%');
      active.style.setProperty('--mr', radius.toFixed(0) + 'px');
    };

    const track = (x: number, y: number, target: EventTarget | null) => {
      const tile = target instanceof Element ? target.closest<HTMLElement>('.bento-tilt') : null;
      if (tile !== active) {
        deactivate();
        if (tile) {
          active = tile;
          tile.setAttribute('data-active', '');
        }
      }
      last = { x, y };
      if (active && !frame) frame = requestAnimationFrame(paint);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // touch is handled below so scrolling stays native
      track(e.clientX, e.clientY, e.target);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      window.clearTimeout(touchTimer);
      track(t.clientX, t.clientY, document.elementFromPoint(t.clientX, t.clientY));
    };
    const onTouchEnd = () => {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(deactivate, MAX_ACTIVE_AFTER_TOUCH_MS);
    };

    grid.addEventListener('pointermove', onPointerMove);
    grid.addEventListener('pointerleave', deactivate);
    grid.addEventListener('touchstart', onTouch, { passive: true });
    grid.addEventListener('touchmove', onTouch, { passive: true });
    grid.addEventListener('touchend', onTouchEnd, { passive: true });
    grid.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      grid.removeEventListener('pointermove', onPointerMove);
      grid.removeEventListener('pointerleave', deactivate);
      grid.removeEventListener('touchstart', onTouch);
      grid.removeEventListener('touchmove', onTouch);
      grid.removeEventListener('touchend', onTouchEnd);
      grid.removeEventListener('touchcancel', onTouchEnd);
      cancelAnimationFrame(frame);
      window.clearTimeout(touchTimer);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default TiltGrid;