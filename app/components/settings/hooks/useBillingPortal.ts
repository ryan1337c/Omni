"use client";

import { useState } from "react";

import { postWithSession } from "../api";
import { getErrorMessage } from "../utils";

export function useBillingPortal() {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const openBillingPortal = async () => {
    setIsPortalLoading(true);
    setPortalError("");

    try {
      const { response, data } = await postWithSession(
        "/api/stripe/create_portal_session",
      );

      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Unable to open billing portal";
        throw new Error(message);
      }

      window.location.assign(data.url);
    } catch (error) {
      setPortalError(getErrorMessage(error, "Unable to open billing portal"));
      setIsPortalLoading(false);
    }
  };

  return { isPortalLoading, portalError, openBillingPortal };
}
