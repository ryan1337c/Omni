"use client";

import { useEffect } from "react";

// Reserves a stable scrollbar gutter on the document while landing routes
// are mounted, so the fixed header does not shift when a page does not scroll.
export default function LandingScrollGutter() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("landing-scrollbar-gutter");
    return () => root.classList.remove("landing-scrollbar-gutter");
  }, []);

  return null;
}
