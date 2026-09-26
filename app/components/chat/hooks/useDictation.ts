"use client";

import { useEffect, useState } from "react";

export function useDictation() {
  const [isDictateModalOpen, setIsDictateModalOpen] = useState(false);
  const [isDictationEnabled, setIsDictationEnabled] = useState(true);

  useEffect(() => {
    setIsDictationEnabled(
      window.localStorage.getItem("dictation-enabled") !== "false",
    );

    const handleDictationSettingChange = (event: Event) => {
      const isEnabled = (event as CustomEvent<boolean>).detail;
      setIsDictationEnabled(isEnabled);

      if (!isEnabled) {
        setIsDictateModalOpen(false);
      }
    };

    window.addEventListener(
      "dictation-setting-change",
      handleDictationSettingChange,
    );

    return () =>
      window.removeEventListener(
        "dictation-setting-change",
        handleDictationSettingChange,
      );
  }, []);

  return {
    isDictateModalOpen,
    setIsDictateModalOpen,
    isDictationEnabled,
  };
}
