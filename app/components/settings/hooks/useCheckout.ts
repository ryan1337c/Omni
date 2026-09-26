"use client";

import { useState } from "react";

import { postWithSession } from "../api";
import type { CheckoutPlan } from "../types";
import { getErrorMessage } from "../utils";

export function useCheckout() {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const openUpgrade = () => {
    setCheckoutError("");
    setIsUpgradeOpen(true);
  };

  const startCheckout = async (plan: CheckoutPlan) => {
    setIsCheckoutLoading(true);
    setCheckoutError("");

    try {
      const { response, data } = await postWithSession(
        "/api/stripe/checkout_sessions",
        { plan },
      );

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start checkout");
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(getErrorMessage(error, "Unable to start checkout"));
      setIsCheckoutLoading(false);
    }
  };

  return {
    isUpgradeOpen,
    setIsUpgradeOpen,
    openUpgrade,
    isCheckoutLoading,
    checkoutError,
    startCheckout,
  };
}
