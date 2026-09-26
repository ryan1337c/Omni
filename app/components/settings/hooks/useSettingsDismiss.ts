"use client";

import { useEffect, type RefObject } from "react";

import type { AccountDialog } from "../types";

type UseSettingsDismissOptions = {
  isOpen: boolean;
  onClose: () => void;
  themeMenuRef: RefObject<HTMLDivElement>;
  isThemeMenuOpen: boolean;
  setIsThemeMenuOpen: (open: boolean) => void;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (open: boolean) => void;
  isCancelConfirmOpen: boolean;
  setIsCancelConfirmOpen: (open: boolean) => void;
  accountDialog: AccountDialog;
  setAccountDialog: (dialog: AccountDialog) => void;
};

export function useSettingsDismiss({
  isOpen,
  onClose,
  themeMenuRef,
  isThemeMenuOpen,
  setIsThemeMenuOpen,
  isUpgradeOpen,
  setIsUpgradeOpen,
  isCancelConfirmOpen,
  setIsCancelConfirmOpen,
  accountDialog,
  setAccountDialog,
}: UseSettingsDismissOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isUpgradeOpen) {
        setIsUpgradeOpen(false);
      } else if (isCancelConfirmOpen) {
        setIsCancelConfirmOpen(false);
      } else if (accountDialog) {
        setAccountDialog(null);
      } else if (isThemeMenuOpen) {
        setIsThemeMenuOpen(false);
      } else {
        onClose();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [
    accountDialog,
    isCancelConfirmOpen,
    isOpen,
    isThemeMenuOpen,
    isUpgradeOpen,
    onClose,
    setAccountDialog,
    setIsCancelConfirmOpen,
    setIsThemeMenuOpen,
    setIsUpgradeOpen,
    themeMenuRef,
  ]);
}
