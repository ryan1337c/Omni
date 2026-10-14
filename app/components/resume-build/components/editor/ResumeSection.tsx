"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { MAX_SECTION_ENTRIES } from '@/lib/resume/parseResumeJson';

import ControlButton from './ControlButton';
import { focusAtEnd } from './EditableText';

type ResumeSectionProps = {
  title: string;
  entryCount: number;
  addLabel: string;
  onAdd: () => void;
  /** Lines sit flush (Technical Skills) instead of being spaced like subheadings. */
  dense?: boolean;
  children: ReactNode;
};

/**
 * A Jake `\section`: small-caps title over a full-width rule, then the entry list indented 0.15in.
 * Empty sections are skipped in the PDF, so here they collapse to an "add" button shown on paper hover.
 */
export function ResumeSection({ title, entryCount, addLabel, onAdd, dense = false, children }: ResumeSectionProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(entryCount);
  const canAdd = entryCount < MAX_SECTION_ENTRIES;

  // Focus the first field of a newly added entry so the user can start typing right away.
  useEffect(() => {
    if (entryCount > previousCount.current) {
      const lastEntry = listRef.current?.lastElementChild;
      const firstField = lastEntry?.querySelector<HTMLElement>('[contenteditable]');
      if (firstField) focusAtEnd(firstField);
    }
    previousCount.current = entryCount;
  }, [entryCount]);

  if (entryCount === 0) {
    return canAdd ? (
      <button
        type="button"
        onClick={onAdd}
        className="mt-[8pt] flex w-full items-center justify-center gap-1 rounded border border-dashed border-slate-300 py-1 font-sans text-xs text-slate-400 opacity-0 transition hover:border-violet-400 hover:text-violet-600 focus-visible:opacity-100 group-hover/paper:opacity-100"
      >
        <FiPlus className="h-3 w-3" aria-hidden /> {addLabel}
      </button>
    ) : null;
  }

  return (
    <section className="group/section mt-[8pt]">
      <div className="relative">
        <h2 className="border-b border-black pb-[1pt] text-[12pt] leading-tight [font-variant-caps:small-caps]">
          {title}
        </h2>
        {canAdd && (
          <div className="absolute left-full top-0 ml-2 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100">
            <ControlButton label={addLabel} icon={FiPlus} onClick={onAdd} />
          </div>
        )}
      </div>
      <div ref={listRef} className={`ml-[0.15in] mt-[3pt] ${dense ? '' : 'space-y-[4pt]'}`}>
        {children}
      </div>
    </section>
  );
}

type ResumeEntryProps = {
  removeLabel: string;
  onRemove: () => void;
  /** Omit to hide the add-bullet control (e.g. sections without bullets, or at the bullet cap). */
  onAddBullet?: () => void;
  children: ReactNode;
};

/** One entry in a section. Its controls sit in the left page margin, clear of the bullet controls on the right. */
export function ResumeEntry({ removeLabel, onRemove, onAddBullet, children }: ResumeEntryProps) {
  return (
    <div className="group/entry relative">
      {children}
      <div className="absolute right-full top-0 mr-[calc(0.15in+0.25rem)] flex flex-col gap-0.5 opacity-0 transition-opacity group-hover/entry:opacity-100 group-focus-within/entry:opacity-100">
        <ControlButton label={removeLabel} icon={FiTrash2} tone="danger" onClick={onRemove} />
        {onAddBullet && <ControlButton label="Add bullet" icon={FiPlus} onClick={onAddBullet} />}
      </div>
    </div>
  );
}

type SubheadingRowProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
};

/** A row of Jake's `tabular*` subheading: left-aligned and right-aligned cells, 0.97\textwidth wide. */
export function SubheadingRow({ left, right, className = '' }: SubheadingRowProps) {
  return (
    <div className={`flex items-baseline justify-between gap-4 pr-[0.075in] ${className}`}>
      <span className="min-w-0">{left}</span>
      <span className="flex-shrink-0 text-right">{right}</span>
    </div>
  );
}
