"use client";

import { useLayoutEffect, type RefObject } from "react";

import {
  findKeywordSpans,
  highlightedKeywords,
  type KeywordMatchResult,
  type WorkHistoryEntryRef,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword, ResumeContent } from "@/lib/resume/schema";

const HIGHLIGHT_NAME = "resume-keyword";
const ENTRY_SELECTOR = "[data-entry-section][data-entry-index]";

type HighlightRegistry = {
  set: (name: string, highlight: Highlight) => void;
  delete: (name: string) => void;
};

function highlightRegistry(): HighlightRegistry | null {
  if (typeof CSS === "undefined" || typeof Highlight === "undefined") return null;
  const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
  return registry ?? null;
}

/** Marks an element as one Work History Entry, so its text is highlighted with that Entry's keywords. */
export function workHistoryEntryProps({ section, entry }: WorkHistoryEntryRef) {
  return { "data-entry-section": section, "data-entry-index": entry };
}

function workHistoryEntryOf(node: Node): WorkHistoryEntryRef | null {
  const element = node.parentElement?.closest<HTMLElement>(ENTRY_SELECTOR);
  if (!element) return null;
  const section = element.dataset.entrySection;
  const entry = Number(element.dataset.entryIndex);
  if ((section !== "experience" && section !== "projects") || !Number.isInteger(entry)) return null;
  return { section, entry };
}

function collectRanges(root: HTMLElement, results: KeywordMatchResult[]): Range[] {
  const ranges: Range[] = [];
  const keywordsByEntry = new Map<string, JdKeyword[]>();
  const keywordsFor = (entry: WorkHistoryEntryRef | null) => {
    const key = entry ? `${entry.section}:${entry.entry}` : "";
    let keywords = keywordsByEntry.get(key);
    if (!keywords) {
      keywords = highlightedKeywords(results, entry);
      keywordsByEntry.set(key, keywords);
    }
    return keywords;
  };
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
      for (const span of findKeywordSpans(text, keywordsFor(workHistoryEntryOf(node)))) {
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
  results: KeywordMatchResult[],
  resume: ResumeContent,
) {
  useLayoutEffect(() => {
    const registry = highlightRegistry();
    if (!registry) return;

    const clear = () => registry.delete(HIGHLIGHT_NAME);
    const root = rootRef.current;
    if (!root || results.length === 0) {
      clear();
      return clear;
    }

    const ranges = collectRanges(root, results);
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
  }, [rootRef, results, resume]);
}
