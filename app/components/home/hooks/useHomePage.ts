"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/app/context/AuthContext";
import { useCheckout } from "@/app/components/settings/hooks/useCheckout";
import type { SettingsSection } from "@/app/components/settings";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";

import type { PremiumFeature, RecentChat } from "../types";

const authServices = new AuthServices();
const publicServices = new PublicServices();

export function useHomePage() {
  const { chatMode, setChatMode, tier } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCheckoutLoading, checkoutError, startCheckout } = useCheckout();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("general");

  const [currChatId, setCurrChatId] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentChat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [chatToRename, setChatToRename] = useState<RecentChat | null>(null);
  const [paywalledFeature, setPaywalledFeature] =
    useState<PremiumFeature | null>(null);

  const isFreeTier = tier === "free";

  useEffect(() => {
    if (searchParams?.get("settings") !== "billing") return;

    setSettingsSection("billing");
    setIsSettingsOpen(true);
    router.replace("/pages/home");
  }, [router, searchParams]);

  const closeSettings = () => {
    setIsSettingsOpen(false);

    if (searchParams?.has("settings")) {
      router.replace("/pages/home");
    }
  };

  const activeChat = recents.find((r) => r.chat_id === currChatId);
  const currentChatTitle =
    activeChat?.chat_title ||
    (chatMode === "new chat" ? "New Chat" : "Untitled");

  useEffect(() => {
    if (chatMode === "recents" && !currChatId && recents.length > 0) {
      setCurrChatId(recents[0].chat_id);
    }
  }, [chatMode, recents]);

  const handleOpenRenameModal = (chat?: RecentChat) => {
    const targetChat = chat || activeChat;
    if (targetChat) {
      setChatToRename(targetChat);
      setRenameInputValue(targetChat.chat_title || "Untitled");
      setIsRenameModalOpen(true);
    }
  };

  const handleNewChat = () => {
    setCurrChatId(null);
    setChatMode("new chat");
  };

  const handleSelectChat = (id: string) => {
    setCurrChatId(id);
    setChatMode("recents");
  };

  const handlePremiumFeatureClick = (feature: PremiumFeature) => {
    if (isFreeTier) {
      setIsMobileSidebarOpen(false);
      setPaywalledFeature(feature);
      return;
    }

    setChatMode(feature);
  };

  const closePaywall = () => setPaywalledFeature(null);

  const handleRenameSubmit = async (newTitle: string) => {
    if (!chatToRename) return;
    try {
      const session = await authServices.getSession();
      const { id } = session.user;

      await publicServices.updateChatTitle(
        id,
        chatToRename.chat_id,
        newTitle,
      );

      setRecents((prev) =>
        prev.map((chat) =>
          chat.chat_id === chatToRename.chat_id
            ? { ...chat, chat_title: newTitle }
            : chat,
        ),
      );
    } catch (error) {
      console.error(error);
    }
    setIsRenameModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await publicServices.deleteHistory(id);
      setRecents((prev) => {
        const updated = prev.filter((chat) => chat.chat_id !== id);
        if (id === currChatId) {
          if (updated.length > 0) {
            setCurrChatId(updated[0].chat_id);
          } else {
            setCurrChatId(null);
            setChatMode("new chat");
          }
        }
        return updated;
      });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  useEffect(() => {
    if (!paywalledFeature) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePaywall();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [paywalledFeature]);

  useEffect(() => {
    const fetchRecents = async () => {
      try {
        const session = await authServices.getSession();
        const data = await publicServices.fetchHistory(session.user.id);
        setRecents(data);
      } catch (error) {
        console.error("Fetch history error:", error);
      }
    };
    fetchRecents();
  }, []);

  return {
    chatMode,
    setChatMode,
    tier,
    router,
    isSidebarExpanded,
    setIsSidebarExpanded,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSettingsOpen,
    settingsSection,
    setSettingsSection,
    setIsSettingsOpen,
    closeSettings,
    currChatId,
    setCurrChatId,
    recents,
    setRecents,
    isProcessing,
    setIsProcessing,
    openMenuId,
    setOpenMenuId,
    isRenameModalOpen,
    setIsRenameModalOpen,
    renameInputValue,
    setRenameInputValue,
    paywalledFeature,
    isFreeTier,
    currentChatTitle,
    handleOpenRenameModal,
    handleNewChat,
    handleSelectChat,
    handlePremiumFeatureClick,
    closePaywall,
    handleRenameSubmit,
    handleDelete,
    isCheckoutLoading,
    checkoutError,
    startCheckout,
  };
}
