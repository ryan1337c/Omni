"use client";

import { useEffect, useState } from "react";

import { AuthServices } from "@/lib/authServices";
import {
  fetchUsageSnapshot,
  formatContextTooLongMessage,
  formatInsufficientCreditsMessage,
  shouldOfferCreditUpgrade,
  type ContextTooLongBody,
  type InsufficientCreditsBody,
} from "@/lib/credits/usageClient";
import type { UsageSnapshot } from "@/lib/credits/types";

import type { ChatMessage, CreditNotice } from "../types";
import { replaceLastMessage } from "../utils";

export function useCreditUsage(
  tier: string | null,
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [creditNotice, setCreditNotice] = useState<CreditNotice | null>(null);
  const authServices = new AuthServices();

  const refreshUsage = async () => {
    try {
      const session = await authServices.getSession();
      const snapshot = await fetchUsageSnapshot(session.access_token);
      setUsage(snapshot);
    } catch (error) {
      console.error("Unable to load usage:", error);
    }
  };

  const applyLimitNotice = (
    message: string,
    options?: { refreshUsage?: boolean },
  ) => {
    setCreditNotice({
      message,
      showUpgrade: shouldOfferCreditUpgrade(tier),
    });
    setChatHistory((prevHistory) =>
      replaceLastMessage(prevHistory, {
        content: message,
        loading: false,
      }),
    );
    if (options?.refreshUsage && tier === "free") {
      void refreshUsage();
    }
  };

  const applyCreditError = (info: InsufficientCreditsBody) => {
    applyLimitNotice(formatInsufficientCreditsMessage(info, tier), {
      refreshUsage: true,
    });
  };

  const applyContextTooLongError = (info: ContextTooLongBody) => {
    applyLimitNotice(formatContextTooLongMessage(info, tier));
  };

  useEffect(() => {
    if (tier !== "free") {
      setUsage(null);
      return;
    }

    let cancelled = false;
    authServices
      .getSession()
      .then((session) => fetchUsageSnapshot(session.access_token))
      .then((snapshot) => {
        if (!cancelled) setUsage(snapshot);
      })
      .catch((error) => {
        console.error("Unable to load usage:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [tier]);

  return {
    usage,
    creditNotice,
    setCreditNotice,
    refreshUsage,
    applyCreditError,
    applyContextTooLongError,
  };
}
