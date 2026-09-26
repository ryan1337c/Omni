"use client";

import { useEffect, useRef, useState } from "react";

export function useThemeMenu() {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return { isThemeMenuOpen, setIsThemeMenuOpen, isMounted, themeMenuRef };
}
