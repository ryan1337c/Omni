"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/app/context/AuthContext";

import AccountSection from "./components/AccountSection";
import AppearanceMenu from "./components/AppearanceMenu";
import BillingDetailsCard from "./components/BillingDetailsCard";
import BillingSection from "./components/BillingSection";
import CancelSubscriptionDialog from "./components/CancelSubscriptionDialog";
import CurrentPlanCard from "./components/CurrentPlanCard";
import DeleteAccountDialog from "./components/DeleteAccountDialog";
import EditNameDialog from "./components/EditNameDialog";
import GeneralSection from "./components/GeneralSection";
import SettingsSidebar from "./components/SettingsSidebar";
import UpgradeDialog from "./components/UpgradeDialog";
import UsageCard from "./components/UsageCard";
import { useAccount } from "./hooks/useAccount";
import { useBillingPortal } from "./hooks/useBillingPortal";
import { useCheckout } from "./hooks/useCheckout";
import { useDeleteAccount } from "./hooks/useDeleteAccount";
import { useDictationSetting } from "./hooks/useDictationSetting";
import { useSettingsDismiss } from "./hooks/useSettingsDismiss";
import { useSubscription } from "./hooks/useSubscription";
import { useThemeMenu } from "./hooks/useThemeMenu";
import { useUsage } from "./hooks/useUsage";
import type { SettingsSection } from "./types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
};

export default function SettingsModal({
  isOpen,
  onClose,
  initialSection = "general",
}: SettingsModalProps) {
  const { tier } = useAuth();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(initialSection);

  const themeMenu = useThemeMenu();
  const dictation = useDictationSetting();
  const checkout = useCheckout();
  const subscription = useSubscription({ isOpen, activeSection, tier });
  const usage = useUsage({ isOpen, activeSection });
  const portal = useBillingPortal();
  const account = useAccount({ isOpen, activeSection });
  const deletion = useDeleteAccount();

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [initialSection, isOpen]);

  useSettingsDismiss({
    isOpen,
    onClose,
    themeMenuRef: themeMenu.themeMenuRef,
    isThemeMenuOpen: themeMenu.isThemeMenuOpen,
    setIsThemeMenuOpen: themeMenu.setIsThemeMenuOpen,
    isUpgradeOpen: checkout.isUpgradeOpen,
    setIsUpgradeOpen: checkout.setIsUpgradeOpen,
    isCancelConfirmOpen: subscription.isCancelConfirmOpen,
    setIsCancelConfirmOpen: subscription.setIsCancelConfirmOpen,
    accountDialog: account.accountDialog,
    setAccountDialog: account.setAccountDialog,
  });

  if (!isOpen) return null;

  const closeAccountDialog = () => account.setAccountDialog(null);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-[min(38rem,85vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:flex-row"
      >
        <SettingsSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onClose={onClose}
        />

        <div
          className="min-w-0 flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900"
          aria-label={`${activeSection} settings`}
        >
          {activeSection === "general" && (
            <GeneralSection
              isFreeTier={tier === "free"}
              onUpgrade={checkout.openUpgrade}
              appearanceMenu={
                <AppearanceMenu
                  isOpen={themeMenu.isThemeMenuOpen}
                  setIsOpen={themeMenu.setIsThemeMenuOpen}
                  isMounted={themeMenu.isMounted}
                  menuRef={themeMenu.themeMenuRef}
                />
              }
              isDictationEnabled={dictation.isDictationEnabled}
              onToggleDictation={dictation.toggleDictation}
            />
          )}

          {activeSection === "billing" && (
            <BillingSection
              tier={tier}
              onUpgrade={checkout.openUpgrade}
              currentPlan={
                tier && (
                  <CurrentPlanCard
                    tier={tier}
                    billingSummary={subscription.billingSummary}
                    isBillingLoading={subscription.isBillingLoading}
                    isCancelling={subscription.isCancelling}
                    cancellationError={subscription.cancellationError}
                    onCancelSubscription={subscription.openCancelConfirm}
                  />
                )
              }
              usage={
                <UsageCard
                  isFreeTier={tier === "free"}
                  usage={usage.usage}
                  isUsageLoading={usage.isUsageLoading}
                  usageError={usage.usageError}
                />
              }
              billingDetails={
                <BillingDetailsCard
                  isPortalLoading={portal.isPortalLoading}
                  portalError={portal.portalError}
                  onOpenBillingPortal={portal.openBillingPortal}
                />
              }
            />
          )}

          {activeSection === "account" && (
            <AccountSection
              isAccountLoading={account.isAccountLoading}
              accountName={account.accountName}
              accountEmail={account.accountEmail}
              onEditName={account.openNameEditor}
              onDeleteAccount={() => {
                deletion.resetDeleteConfirmation();
                account.setAccountDialog("delete");
              }}
            />
          )}
        </div>

        {checkout.isUpgradeOpen && (
          <UpgradeDialog
            isCheckoutLoading={checkout.isCheckoutLoading}
            checkoutError={checkout.checkoutError}
            onCheckout={checkout.startCheckout}
            onClose={() => checkout.setIsUpgradeOpen(false)}
          />
        )}

        {subscription.isCancelConfirmOpen && (
          <CancelSubscriptionDialog
            isCancelling={subscription.isCancelling}
            cancellationError={subscription.cancellationError}
            onConfirm={subscription.cancelSubscription}
            onClose={() => subscription.setIsCancelConfirmOpen(false)}
          />
        )}

        {account.accountDialog === "name" && (
          <EditNameDialog
            nameDraft={account.nameDraft}
            onNameDraftChange={account.setNameDraft}
            isSavingName={account.isSavingName}
            nameError={account.nameError}
            onSubmit={account.saveName}
            onClose={closeAccountDialog}
          />
        )}

        {account.accountDialog === "delete" && (
          <DeleteAccountDialog
            confirmations={[
              {
                checked: deletion.hasConfirmedSubscriptionCancellation,
                onChange: deletion.setHasConfirmedSubscriptionCancellation,
                label:
                  "Any active subscriptions will be canceled immediately with no refunds.",
              },
              {
                checked: deletion.hasConfirmedDataDeletion,
                onChange: deletion.setHasConfirmedDataDeletion,
                label:
                  "All chats, files, generated content, and account data will be permanently deleted.",
              },
              {
                checked: deletion.hasConfirmedIrreversible,
                onChange: deletion.setHasConfirmedIrreversible,
                label:
                  "I understand this action takes effect immediately and cannot be undone.",
              },
            ]}
            isDeletingAccount={deletion.isDeletingAccount}
            deleteAccountError={deletion.deleteAccountError}
            onConfirm={deletion.deleteAccount}
            onClose={closeAccountDialog}
          />
        )}
      </section>
    </div>
  );
}
