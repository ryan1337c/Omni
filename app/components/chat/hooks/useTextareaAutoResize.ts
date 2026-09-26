"use client";

import { useCallback, useRef } from "react";

import { TEXTAREA_MAX_HEIGHT } from "../constants";

export function useTextareaAutoResize() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = TEXTAREA_MAX_HEIGHT;

      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = scrollHeight + "px";
        textareaRef.current.style.overflowY = "hidden";
      } else {
        textareaRef.current.style.height = maxHeight + "px";
        textareaRef.current.style.overflowY = "auto";
      }
    }
  }, []);

  return { textareaRef, handleInput };
}
