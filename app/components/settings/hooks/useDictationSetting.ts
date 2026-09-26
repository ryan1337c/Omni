"use client";

import { useEffect, useState } from "react";

export function useDictationSetting() {
  const [isDictationEnabled, setIsDictationEnabled] = useState(true);

  useEffect(() => {
    setIsDictationEnabled(
      window.localStorage.getItem("dictation-enabled") !== "false",
    );
  }, []);

  const toggleDictation = () => {
    const nextValue = !isDictationEnabled;
    setIsDictationEnabled(nextValue);
    window.localStorage.setItem("dictation-enabled", String(nextValue));
    window.dispatchEvent(
      new CustomEvent("dictation-setting-change", { detail: nextValue }),
    );
  };

  return { isDictationEnabled, toggleDictation };
}
