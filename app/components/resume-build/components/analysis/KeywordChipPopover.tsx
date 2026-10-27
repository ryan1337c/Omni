"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import KeywordTag from './KeywordTag';
import type { ChipEmphasis, KeywordChip } from './depthBands';

type KeywordChipPopoverProps = {
  label: ReactNode;
  chip: KeywordChip;
  /** Each option's state when the chip is a set of Alternatives; empty otherwise. */
  alternatives?: { term: string; state: string }[];
  /** An Other Keyword's Clause; "" when it has none. */
  clause?: string;
  emphasis?: ChipEmphasis;
};

/** Gap kept between the popover and the viewport edge, in px. */
const VIEWPORT_MARGIN = 8;

/**
 * A keyword chip that explains its state in a toggletip.
 * Opens on click, tap, or keyboard focus; closes on Escape, outside press, or focus leaving.
 * The `role="status"` region stays mounted so inserted content is announced.
 */
export default function KeywordChipPopover({ label, chip, alternatives = [], clause = '', emphasis }: KeywordChipPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Keep the popover inside the chip list and the viewport, which clip it horizontally on narrow screens.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const bounds = wrapperRef.current?.parentElement;
    if (!open || !popover || !bounds) return;
    popover.style.transform = '';
    const box = popover.getBoundingClientRect();
    const area = bounds.getBoundingClientRect();
    const right = Math.min(area.right, window.innerWidth - VIEWPORT_MARGIN);
    const left = Math.max(area.left, VIEWPORT_MARGIN);
    const shift = Math.max(Math.min(0, right - box.right), left - box.left);
    popover.style.transform = shift ? `translateX(${shift}px)` : '';
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setOpen(true);
        }}
        onBlur={(event) => {
          if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-800"
      >
        <KeywordTag label={label} band={chip.band} srLabel={chip.srLabel} required={chip.required} implied={chip.implied} emphasis={emphasis} />
      </button>
      <span
        ref={popoverRef}
        id={popoverId}
        role="status"
        onMouseDown={(event) => event.preventDefault()}
        className={
          open
            ? 'absolute left-0 top-full z-20 mt-1.5 block w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:text-gray-300'
            : undefined
        }
      >
        {open && (
          <>
            <span className="block font-semibold text-slate-900 dark:text-white">{chip.hint}</span>
            <span className="mt-1 block">{chip.meaning}</span>
            {alternatives.length > 0 && (
              <span className="mt-2 block">
                <span className="font-medium text-slate-900 dark:text-white">Any one counts.</span>
                {alternatives.map(({ term, state }, index) => (
                  <span key={`${term}-${index}`} className="block">
                    {term}: {state}
                  </span>
                ))}
              </span>
            )}
            {clause && (
              <span className="mt-2 block">
                <span className="font-medium text-slate-900 dark:text-white">Job description:</span> {clause}
              </span>
            )}
            {chip.implied && chip.shownIn.length > 0 && (
              <span className="mt-2 block">
                <span className="font-medium text-slate-900 dark:text-white">Not named.</span> Shown in:{' '}
                {chip.shownIn.join('; ')}
              </span>
            )}
            {chip.tip && <span className="mt-1 block">{chip.tip}</span>}
          </>
        )}
      </span>
    </span>
  );
}
