"use client";

import { useEffect, useState, type FormEvent } from "react";

import { authServices } from "../api";
import type { AccountDialog, SettingsSection } from "../types";
import { getErrorMessage } from "../utils";

type UseAccountOptions = {
  isOpen: boolean;
  activeSection: SettingsSection;
};

export function useAccount({ isOpen, activeSection }: UseAccountOptions) {
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [accountDialog, setAccountDialog] = useState<AccountDialog>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!isOpen || activeSection !== "account") return;

    let isCurrent = true;
    setIsAccountLoading(true);

    authServices
      .getSession()
      .then((session) => {
        if (!isCurrent) return;

        const metadata = session.user.user_metadata;
        const fullName =
          metadata.full_name ||
          metadata.name ||
          [metadata.firstName, metadata.lastName].filter(Boolean).join(" ");

        setAccountName(fullName || "Not provided");
        setAccountEmail(session.user.email ?? "Not provided");
      })
      .catch((error) => {
        console.error("Unable to load account details:", error);
      })
      .finally(() => {
        if (isCurrent) setIsAccountLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen]);

  const openNameEditor = () => {
    setNameDraft(accountName === "Not provided" ? "" : accountName);
    setNameError("");
    setAccountDialog("name");
  };

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = nameDraft.trim();
    if (!trimmedName) return;

    setIsSavingName(true);
    setNameError("");

    try {
      await authServices.updateProfileName(trimmedName);
      setAccountName(trimmedName);
      setAccountDialog(null);
    } catch (error) {
      setNameError(getErrorMessage(error, "Unable to update name"));
    } finally {
      setIsSavingName(false);
    }
  };

  return {
    accountName,
    accountEmail,
    isAccountLoading,
    accountDialog,
    setAccountDialog,
    nameDraft,
    setNameDraft,
    isSavingName,
    nameError,
    openNameEditor,
    saveName,
  };
}
