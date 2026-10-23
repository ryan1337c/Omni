"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { GripVertical, ListPlus } from 'lucide-react';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { WorkHistoryEntryRef } from '@/lib/resume/keywordMatch';
import { MAX_SECTION_ENTRIES } from '@/lib/resume/parseResumeJson';
import { SECTION_TITLES, type SectionId } from '@/lib/resume/schema';

import { workHistoryEntryProps } from '../../hooks/useResumeKeywordHighlights';
import ControlButton from './ControlButton';
import { focusAtEnd } from './EditableText';
import { useSectionReorder } from './SectionReorder';

type ResumeSectionProps = {
  id: SectionId;
  entryCount: number;
  addLabel: string;
  onAdd: () => void;
  /** Hides the add control once reached. Defaults to the parser's section cap. */
  maxEntries?: number;
  /** Lines sit flush (Technical Skills) instead of being spaced like subheadings. */
  dense?: boolean;
  children: ReactNode;
};

/**
 * A Jake `\section`: small-caps title over a full-width rule, then the entry list indented 0.15in.
 * Empty sections are skipped in the PDF, so here they collapse to an "add" button shown on paper hover.
 * The title and the grip at the end of its row are drag handles; the arrows beside the grip move the section one step.
 */
export function ResumeSection({
  id,
  entryCount,
  addLabel,
  onAdd,
  maxEntries = MAX_SECTION_ENTRIES,
  dense = false,
  children,
}: ResumeSectionProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(entryCount);
  const reorder = useSectionReorder(id);
  const canAdd = entryCount < maxEntries;
  const title = SECTION_TITLES[id];

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
    <section
      {...reorder?.dropProps}
      className={`group/section relative mt-[8pt] ${reorder?.isDragging ? 'opacity-40' : ''}`}
    >
      {reorder?.dropEdge && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 h-0.5 rounded bg-violet-500 ${
            reorder.dropEdge === 'before' ? '-top-[4pt]' : '-bottom-[4pt]'
          }`}
        />
      )}
      <div className="relative">
        <h2
          {...reorder?.handleProps}
          title={reorder ? 'Drag to reorder' : undefined}
          className={`border-b border-black pb-[1pt] text-[12pt] leading-tight [font-variant-caps:small-caps] ${
            reorder ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          {title}
          {/* Smaller than the title's line box, so the hidden button adds no height the PDF wouldn't have. */}
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="pointer-events-none ml-2 inline-flex items-center gap-1 rounded border border-dashed border-slate-300 bg-white px-1.5 py-px align-middle font-sans text-[10px] leading-none text-slate-400 opacity-0 transition [font-variant-caps:normal] hover:border-violet-400 hover:text-violet-600 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/section:pointer-events-auto group-hover/section:opacity-100 group-focus-within/section:pointer-events-auto group-focus-within/section:opacity-100"
            >
              <FiPlus className="h-2.5 w-2.5" aria-hidden /> {addLabel}
            </button>
          )}
        </h2>
        {/* Inside the page, at the empty right end of the title row: the margins belong to entry and bullet controls. */}
        {reorder && (reorder.moveUp || reorder.moveDown) && (
          <div className="absolute bottom-[2pt] right-0 flex gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100">
            <span
              {...reorder.handleProps}
              aria-hidden
              title="Drag to reorder"
              className="flex h-5 w-5 cursor-grab items-center justify-center rounded bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:text-violet-600 active:cursor-grabbing"
            >
              <GripVertical className="h-3 w-3" />
            </span>
            {reorder.moveUp && <ControlButton label={`Move ${title} up`} icon={FiArrowUp} onClick={reorder.moveUp} />}
            {reorder.moveDown && (
              <ControlButton label={`Move ${title} down`} icon={FiArrowDown} onClick={reorder.moveDown} />
            )}
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
  /** Set for Experience and Projects Entries, whose keywords are highlighted per Entry. */
  workHistoryEntry?: WorkHistoryEntryRef;
  children: ReactNode;
};

/** One entry in a section. Its controls sit in the left page margin, clear of the bullet controls on the right. */
export function ResumeEntry({ removeLabel, onRemove, onAddBullet, workHistoryEntry, children }: ResumeEntryProps) {
  return (
    <div className="group/entry relative" {...(workHistoryEntry && workHistoryEntryProps(workHistoryEntry))}>
      {children}
      <div className="absolute right-full top-0 mr-[calc(0.15in+0.25rem)] flex flex-col gap-0.5 opacity-0 transition-opacity group-hover/entry:opacity-100 group-focus-within/entry:opacity-100">
        <ControlButton label={removeLabel} icon={FiTrash2} tone="danger" onClick={onRemove} />
        {onAddBullet && <ControlButton label="Add bullet" icon={ListPlus} onClick={onAddBullet} />}
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
