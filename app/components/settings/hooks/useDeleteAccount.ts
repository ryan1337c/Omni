"use client";

import { useState } from "react";

import { authServices, postWithSession } from "../api";
import { getErrorMessage } from "../utils";

export function useDeleteAccount() {
  const [
    hasConfirmedSubscriptionCancellation,
    setHasConfirmedSubscriptionCancellation,
  ] = useState(false);
  const [hasConfirmedDataDeletion, setHasConfirmedDataDeletion] =
    useState(false);
  const [hasConfirmedIrreversible, setHasConfirmedIrreversible] =
    useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const resetDeleteConfirmation = () => {
    setHasConfirmedSubscriptionCancellation(false);
    setHasConfirmedDataDeletion(false);
    setHasConfirmedIrreversible(false);
    setDeleteAccountError("");
  };

  const deleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError("");

    try {
      const { response, data } = await postWithSession("/api/account/delete");

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete account");
      }

      await authServices.logout();
      window.location.assign("/");
    } catch (error) {
      setDeleteAccountError(getErrorMessage(error, "Unable to delete account"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return {
    hasConfirmedSubscriptionCancellation,
    setHasConfirmedSubscriptionCancellation,
    hasConfirmedDataDeletion,
    setHasConfirmedDataDeletion,
    hasConfirmedIrreversible,
    setHasConfirmedIrreversible,
    isDeletingAccount,
    deleteAccountError,
    resetDeleteConfirmation,
    deleteAccount,
  };
}
