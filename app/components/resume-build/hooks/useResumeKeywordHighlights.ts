"use client";

import { useLayoutEffect, type RefObject } from "react";

import { resumeHighlights, type ResumeHighlights } from "@/lib/resume/highlights";
import { findKeywordSpans, isWorkHistory, type KeywordMatchResult } from "@/lib/resume/keywordMatch";
import {
  PLACEMENT_ENTRY_SECTIONS,
  WHOLE_SECTION_PLACEMENTS,
  type JdKeyword,
  type PlacementSource,
  type ResumeContent,
} from "@/lib/resume/schema";

const KEYWORD_HIGHLIGHT = "resume-keyword";
const BULLET_HIGHLIGHT = "resume-demonstrating-bullet";
const PLACEMENT_SELECTOR = "[data-placement-section]";
const BULLET_SELECTOR = "[data-bullet-index]";
const ENTRY_SECTIONS = new Set<string>(PLACEMENT_ENTRY_SECTIONS);
const WHOLE_SECTIONS = new Set<string>(WHOLE_SECTION_PLACEMENTS);

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

/** Marks an element as one Bullet of the Entry it sits in, so it can be highlighted as a Soft Skill example. */
export function bulletProps(bullet: number) {
  return { "data-bullet-index": bullet };
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

function collectKeywordRanges(root: HTMLElement, highlights: ResumeHighlights): Range[] {
  const ranges: Range[] = [];
  const keywordsByPlacement = new Map<string, JdKeyword[]>();
  const keywordsFor = (source: PlacementSource | null) => {
    const key = JSON.stringify(source);
    let keywords = keywordsByPlacement.get(key);
    if (!keywords) {
      keywords = highlights.keywordsIn(source);
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

function collectBulletRanges(root: HTMLElement, highlights: ResumeHighlights): Range[] {
  const ranges: Range[] = [];
  for (const element of root.querySelectorAll<HTMLElement>(`${PLACEMENT_SELECTOR} ${BULLET_SELECTOR}`)) {
    const placement = placementOf(element);
    const bullet = Number(element.dataset.bulletIndex);
    const editable = element.querySelector("[contenteditable]");
    if (!placement || !isWorkHistory(placement) || !editable || !Number.isInteger(bullet)) continue;
    if (!highlights.isDemonstratingBullet({ ...placement, bullet })) continue;
    const range = document.createRange();
    range.selectNodeContents(editable);
    ranges.push(range);
  }
  return ranges;
}

/** A higher `priority` paints over a lower one where ranges overlap. */
function paint(registry: HighlightRegistry, name: string, ranges: Range[], priority: number) {
  if (ranges.length === 0) {
    registry.delete(name);
    return;
  }
  try {
    const highlight = new Highlight(...ranges);
    highlight.priority = priority;
    registry.set(name, highlight);
  } catch {
    registry.delete(name);
  }
}

/**
 * Paints matched keywords, and Bullets that demonstrate a Soft Skill, inside the resume page without
 * touching the editable text. `results` describe `scoredResume`; `resume` is the one on screen, and
 * its change is the signal that the text nodes changed. The spans are read from the DOM.
 */
export function useResumeKeywordHighlights(
  rootRef: RefObject<HTMLElement | null>,
  results: KeywordMatchResult[],
  scoredResume: ResumeContent,
  resume: ResumeContent,
) {
  useLayoutEffect(() => {
    const registry = highlightRegistry();
    if (!registry) return;

    const clear = () => {
      registry.delete(KEYWORD_HIGHLIGHT);
      registry.delete(BULLET_HIGHLIGHT);
    };
    const root = rootRef.current;
    if (!root || results.length === 0) {
      clear();
      return clear;
    }

    const highlights = resumeHighlights(results, scoredResume, resume);
    paint(registry, BULLET_HIGHLIGHT, collectBulletRanges(root, highlights), 0);
    paint(registry, KEYWORD_HIGHLIGHT, collectKeywordRanges(root, highlights), 1);
    return clear;
  }, [rootRef, results, scoredResume, resume]);
}
