"use client";

import { createContext, useContext, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import type { SectionId } from '@/lib/resume/schema';

// A private MIME type, so contenteditable fields never accept the drag as pasted text.
const DRAG_TYPE = 'application/x-resume-section';

type ReorderState = {
  visibleOrder: SectionId[];
  dragging: SectionId | null;
  dropTarget: SectionId | null;
  setDragging: (id: SectionId | null) => void;
  setDropTarget: (id: SectionId | null) => void;
  onMove: (section: SectionId, target: SectionId) => void;
};

const ReorderContext = createContext<ReorderState | null>(null);

type SectionReorderProviderProps = {
  /** Sections currently on the page, in order. Hidden (empty) sections are not move targets. */
  visibleOrder: SectionId[];
  onMove: (section: SectionId, target: SectionId) => void;
  children: ReactNode;
};

export function SectionReorderProvider({ visibleOrder, onMove, children }: SectionReorderProviderProps) {
  const [dragging, setDragging] = useState<SectionId | null>(null);
  const [dropTarget, setDropTarget] = useState<SectionId | null>(null);

  const value = useMemo(
    () => ({ visibleOrder, dragging, dropTarget, setDragging, setDropTarget, onMove }),
    [visibleOrder, dragging, dropTarget, onMove],
  );

  return <ReorderContext.Provider value={value}>{children}</ReorderContext.Provider>;
}

export type SectionReorderControls = {
  moveUp?: () => void;
  moveDown?: () => void;
  isDragging: boolean;
  /** Where the dragged section would land relative to this one, if it is the drop target. */
  dropEdge: 'before' | 'after' | null;
  handleProps: {
    draggable: true;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: () => void;
  };
  dropProps: {
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
};

/** Arrow and drag-and-drop handlers for one visible section, or null outside a provider. */
export function useSectionReorder(id: SectionId): SectionReorderControls | null {
  const state = useContext(ReorderContext);
  if (!state) return null;

  const { visibleOrder, dragging, dropTarget, setDragging, setDropTarget, onMove } = state;
  const index = visibleOrder.indexOf(id);
  const above = index > 0 ? visibleOrder[index - 1] : undefined;
  const below = index !== -1 && index < visibleOrder.length - 1 ? visibleOrder[index + 1] : undefined;

  const endDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };

  let dropEdge: SectionReorderControls['dropEdge'] = null;
  if (dragging && dropTarget === id && dragging !== id) {
    dropEdge = visibleOrder.indexOf(dragging) > index ? 'before' : 'after';
  }

  return {
    moveUp: above ? () => onMove(id, above) : undefined,
    moveDown: below ? () => onMove(id, below) : undefined,
    isDragging: dragging === id,
    dropEdge,
    handleProps: {
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.setData(DRAG_TYPE, id);
        event.dataTransfer.effectAllowed = 'move';
        setDragging(id);
      },
      onDragEnd: endDrag,
    },
    dropProps: {
      onDragOver: (event) => {
        if (!dragging || dragging === id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dropTarget !== id) setDropTarget(id);
      },
      onDragLeave: (event) => {
        // dragleave also fires when moving between children of the same section.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        if (dropTarget === id) setDropTarget(null);
      },
      onDrop: (event) => {
        if (!dragging || dragging === id) return;
        event.preventDefault();
        onMove(dragging, id);
        endDrag();
      },
    },
  };
}
