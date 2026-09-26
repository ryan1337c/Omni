"use client";

import { useEffect, useState } from "react";

import type { UsageSnapshot } from "@/lib/credits/types";
import { fetchUsageSnapshot } from "@/lib/credits/usageClient";

import { authServices } from "../api";
import type { SettingsSection } from "../types";

type UseUsageOptions = {
  isOpen: boolean;
  activeSection: SettingsSection;
};

export function useUsage({ isOpen, activeSection }: UseUsageOptions) {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  useEffect(() => {
    if (!isOpen || activeSection !== "billing") {
      return;
    }

    let isCurrent = true;
    setIsUsageLoading(true);
    setUsageError("");

    authServices
      .getSession()
      .then((session) => fetchUsageSnapshot(session.access_token))
      .then((snapshot) => {
        if (isCurrent) setUsage(snapshot);
      })
      .catch((error) => {
        console.error("Unable to load usage:", error);
        if (isCurrent) {
          setUsage(null);
          setUsageError("Unable to load usage");
        }
      })
      .finally(() => {
        if (isCurrent) setIsUsageLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen]);

  return { usage, isUsageLoading, usageError };
}
