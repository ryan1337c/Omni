"use client";

import { useLayoutEffect, type RefObject } from "react";

import {
  findKeywordSpans,
  highlightedKeywords,
  type KeywordMatchResult,
} from "@/lib/resume/keywordMatch";
import type { JdKeyword, PlacementSource, ResumeContent } from "@/lib/resume/schema";

const HIGHLIGHT_NAME = "resume-keyword";
const PLACEMENT_SELECTOR = "[data-placement-section]";
const ENTRY_SECTIONS = new Set(["experience", "projects", "education"]);
const WHOLE_SECTIONS = new Set(["summary", "skills", "honors"]);

type HighlightRegistry = {
  set: (name: string, highlight: Highlight) => void;
  delete: (name: string) => void;
};

function highlightRegistry(): HighlightRegistry | null {
  if (typeof CSS === "undefined" || typeof Highlight === "undefined") return null;
  const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
  return registry ?? null;
}

/** Marks an element as one Placement, so its text is highlighted with that Placement's keywords. */
export function placementProps(source: PlacementSource) {
  return "entry" in source
    ? { "data-placement-section": source.section, "data-placement-entry": source.entry }
    : { "data-placement-section": source.section };
}

function placementOf(node: Node): PlacementSource | null {
  const element = node.parentElement?.closest<HTMLElement>(PLACEMENT_SELECTOR);
  if (!element) return null;
  const section = element.dataset.placementSection ?? "";
  if (WHOLE_SECTIONS.has(section)) return { section } as PlacementSource;
  const entry = Number(element.dataset.placementEntry);
  if (!ENTRY_SECTIONS.has(section) || !Number.isInteger(entry)) return null;
  return { section, entry } as PlacementSource;
}

function collectRanges(root: HTMLElement, results: KeywordMatchResult[]): Range[] {
  const ranges: Range[] = [];
  const keywordsByPlacement = new Map<string, JdKeyword[]>();
  const keywordsFor = (source: PlacementSource | null) => {
    const key = JSON.stringify(source);
    let keywords = keywordsByPlacement.get(key);
    if (!keywords) {
      keywords = highlightedKeywords(results, source);
      keywordsByPlacement.set(key, keywords);
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
      for (const span of findKeywordSpans(text, keywordsFor(placementOf(node)))) {
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
