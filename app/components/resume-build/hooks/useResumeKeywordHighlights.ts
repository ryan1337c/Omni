"use client";

import { useLayoutEffect, type RefObject } from "react";

import { findKeywordSpans } from "@/lib/resume/keywordMatch";
import type { JdKeyword, ResumeContent } from "@/lib/resume/schema";

const HIGHLIGHT_NAME = "resume-keyword";

type HighlightRegistry = {
  set: (name: string, highlight: Highlight) => void;
  delete: (name: string) => void;
};

function highlightRegistry(): HighlightRegistry | null {
  if (typeof CSS === "undefined" || typeof Highlight === "undefined") return null;
  const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
  return registry ?? null;
}

function collectRanges(root: HTMLElement, keywords: JdKeyword[]): Range[] {
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest("[contenteditable]")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    const text = node.textContent ?? "";
    if (text) {
      for (const span of findKeywordSpans(text, keywords)) {
        if (span.end > text.length) continue;
        const range = document.createRange();
        range.setStart(node, span.start);
        range.setEnd(node, span.end);
        ranges.push(range);
      }
    }
    node = walker.nextNode();
  }

  return ranges;
}

/**
 * Paints matched keywords inside the resume page without touching the editable text.
 * `resume` is only a signal that the text nodes changed; the spans are read from the DOM.
 */
export function useResumeKeywordHighlights(
  rootRef: RefObject<HTMLElement | null>,
  keywords: JdKeyword[],
  resume: ResumeContent,
) {
  useLayoutEffect(() => {
    const registry = highlightRegistry();
    if (!registry) return;

    const clear = () => registry.delete(HIGHLIGHT_NAME);
    const root = rootRef.current;
    if (!root || keywords.length === 0) {
      clear();
      return clear;
    }

    const ranges = collectRanges(root, keywords);
    if (ranges.length === 0) {
      clear();
      return clear;
    }

    try {
      registry.set(HIGHLIGHT_NAME, new Highlight(...ranges));
    } catch {
      clear();
    }
    return clear;
  }, [rootRef, keywords, resume]);
}
