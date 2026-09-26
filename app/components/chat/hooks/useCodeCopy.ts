"use client";

import { useCallback, useEffect } from "react";

export function useCodeCopy() {
  const copyToClipboard = useCallback((text: string, buttonElement: HTMLElement) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = "Copied!";

        setTimeout(() => {
          buttonElement.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("copy-btn")) {
        const blockId = target.getAttribute("data-block-id");
        const codeEl = document.getElementById(blockId!);
        if (codeEl) {
          copyToClipboard(codeEl.textContent || "", target);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [copyToClipboard]);
}
