"use client";

import RenameModal from "@/app/components/RenameModal";
import SettingsModal from "@/app/components/settings";

import HomeMainPanel from "./components/HomeMainPanel";
import HomeSidebar from "./components/HomeSidebar";
import PremiumPaywallModal from "./components/PremiumPaywallModal";
import { useHomePage } from "./hooks/useHomePage";

export default function HomePage() {
  const home = useHomePage();

  return (
    <>
      <main className="w-full flex flex-col h-dvh overflow-hidden">
        <div className="flex flex-1 overflow-hidden relative">
          {home.isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-20 md:hidden"
              onClick={() => home.setIsMobileSidebarOpen(false)}
            ></div>
          )}

          <HomeSidebar
            isSidebarExpanded={home.isSidebarExpanded}
            setIsSidebarExpanded={home.setIsSidebarExpanded}
            isMobileSidebarOpen={home.isMobileSidebarOpen}
            isProcessing={home.isProcessing}
            chatMode={home.chatMode}
            setChatMode={home.setChatMode}
            isFreeTier={home.isFreeTier}
            recents={home.recents}
            currChatId={home.currChatId}
            openMenuId={home.openMenuId}
            setOpenMenuId={home.setOpenMenuId}
            tier={home.tier}
            router={home.router}
            onNewChat={home.handleNewChat}
            onSelectChat={home.handleSelectChat}
            onPremiumFeatureClick={home.handlePremiumFeatureClick}
            onOpenRenameModal={home.handleOpenRenameModal}
            onDelete={home.handleDelete}
            onSettingsClick={() => {
              home.setSettingsSection("general");
              home.setIsSettingsOpen(true);
            }}
          />

          <div className="w-px flex-shrink-0 bg-slate-300 dark:bg-slate-600 hidden md:block" />

          <HomeMainPanel
            chatMode={home.chatMode}
            isProcessing={home.isProcessing}
            setIsProcessing={home.setIsProcessing}
            currentChatTitle={home.currentChatTitle}
            recents={home.recents}
            currChatId={home.currChatId}
            setCurrChatId={home.setCurrChatId}
            setRecents={home.setRecents}
            openMenuId={home.openMenuId}
            setOpenMenuId={home.setOpenMenuId}
            onMobileSidebarOpen={() => home.setIsMobileSidebarOpen(true)}
            onOpenRenameModal={() => home.handleOpenRenameModal()}
            onNewChat={home.handleNewChat}
            onSelectChat={home.handleSelectChat}
            onDelete={home.handleDelete}
          />
        </div>

        <RenameModal
          isOpen={home.isRenameModalOpen}
          onClose={() => home.setIsRenameModalOpen(false)}
          onSubmit={home.handleRenameSubmit}
          currentTitle={home.renameInputValue}
          setInputValue={home.setRenameInputValue}
        />
        <SettingsModal
          isOpen={home.isSettingsOpen}
          initialSection={home.settingsSection}
          onClose={home.closeSettings}
        />
        {home.paywalledFeature && (
          <PremiumPaywallModal
            feature={home.paywalledFeature}
            isCheckoutLoading={home.isCheckoutLoading}
            checkoutError={home.checkoutError}
            onClose={home.closePaywall}
            onPlanSelection={home.startCheckout}
          />
        )}
      </main>
    </>
  );
}
