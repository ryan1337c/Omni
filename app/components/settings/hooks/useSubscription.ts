"use client";

import { useEffect, useState } from "react";

import { authServices, postWithSession, publicServices } from "../api";
import type { BillingSummary, SettingsSection } from "../types";
import { getErrorMessage } from "../utils";

type UseSubscriptionOptions = {
  isOpen: boolean;
  activeSection: SettingsSection;
  tier: string | null | undefined;
};

export function useSubscription({
  isOpen,
  activeSection,
  tier,
}: UseSubscriptionOptions) {
  const [billingSummary, setBillingSummary] =
    useState<BillingSummary | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || activeSection !== "billing" || !tier || tier === "free") {
      return;
    }

    let isCurrent = true;
    setIsBillingLoading(true);

    authServices
      .getSession()
      .then((session) => publicServices.getBillingSummary(session.user.id))
      .then((summary) => {
        if (isCurrent) setBillingSummary(summary);
      })
      .catch((error) => {
        console.error("Unable to load billing details:", error);
      })
      .finally(() => {
        if (isCurrent) setIsBillingLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen, tier]);

  const openCancelConfirm = () => {
    setCancellationError("");
    setIsCancelConfirmOpen(true);
  };

  const cancelSubscription = async () => {
    setIsCancelling(true);
    setCancellationError("");

    try {
      const { response, data } = await postWithSession(
        "/api/stripe/cancel_subscription",
      );

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to cancel subscription");
      }

      setBillingSummary((summary) =>
        summary
          ? {
              ...summary,
              cancel_at_period_end: true,
              tier_expires_at: data.currentPeriodEnd ?? summary.tier_expires_at,
            }
          : summary,
      );
      setIsCancelConfirmOpen(false);
    } catch (error) {
      setCancellationError(
        getErrorMessage(error, "Unable to cancel subscription"),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    billingSummary,
    isBillingLoading,
    isCancelling,
    cancellationError,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    openCancelConfirm,
    cancelSubscription,
  };
}
