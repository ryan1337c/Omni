"use client";

import { FaCircle, FaUserCircle } from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FiPlus } from "react-icons/fi";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { MdOutlineQuiz } from "react-icons/md";
import { TbCards } from "react-icons/tb";
import {
  PanelLeftClose,
  PanelRightOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  LockKeyhole,
} from "lucide-react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import SidebarTooltip from "@/app/components/SidebarTooltip";
import ProfileMenu from "@/app/components/ProfileMenu";

import type { PremiumFeature, RecentChat } from "../types";

type HomeSidebarProps = {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobileSidebarOpen: boolean;
  isProcessing: boolean;
  chatMode: string;
  setChatMode: (mode: string) => void;
  isFreeTier: boolean;
  recents: RecentChat[];
  currChatId: string | null;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  tier: string | null | undefined;
  router: AppRouterInstance;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onPremiumFeatureClick: (feature: PremiumFeature) => void;
  onOpenRenameModal: (chat?: RecentChat) => void;
  onDelete: (id: string) => void;
  onSettingsClick: () => void;
};

export default function HomeSidebar({
  isSidebarExpanded,
  setIsSidebarExpanded,
  isMobileSidebarOpen,
  isProcessing,
  chatMode,
  setChatMode,
  isFreeTier,
  recents,
  currChatId,
  openMenuId,
  setOpenMenuId,
  tier,
  router,
  onNewChat,
  onSelectChat,
  onPremiumFeatureClick,
  onOpenRenameModal,
  onDelete,
  onSettingsClick,
}: HomeSidebarProps) {
  return (
    <div
      className={`
          absolute inset-y-0 left-0 z-30 flex flex-col flex-shrink-0 
          bg-landingPageLight dark:bg-landingPage
          transition-[width] duration-300 ease-in-out md:static
          ${isSidebarExpanded ? "w-64" : "w-20"}
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
    >
      <div className="flex flex-col h-full min-h-0 p-4 text-slate-800 dark:text-textDark">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div
            className={`flex-shrink-0 flex items-center mb-6 justify-between`}
          >
            <div className="flex items-center overflow-hidden">
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 rounded-lg group text-slate-600 dark:text-textDark"
              >
                {isSidebarExpanded ? (
                  <PanelLeftClose size={20} />
                ) : (
                  <PanelRightOpen size={20} />
                )}
              </button>
              <button
                disabled={isProcessing}
                className={`whitespace-nowrap font-bold text-xl transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0"} text-lg text-slate-800 dark:text-textDark`}
                onClick={() => router.push("/")}
              >
                Omni
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-2">
            <SidebarTooltip text="New Chat" isSidebarExpanded={isSidebarExpanded}>
              <button
                disabled={isProcessing}
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark hover:bg-violet-200 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
                onClick={onNewChat}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: 24, height: 24 }}
                  >
                    <FaCircle
                      className="absolute transition-transform duration-300 ease-in-out group-hover:scale-110 [--plus-bg:#8b5cf6] dark:[--plus-bg:#6366F1]"
                      color={"var(--plus-bg)"}
                      size={24}
                    />
                    <FiPlus
                      className="absolute text-textDark transition-transform duration-300 ease-in-out group-hover:scale-125"
                      size={24 * 0.6}
                      strokeWidth={3}
                    />
                  </div>
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}
                  >
                    New Chat
                  </span>
                </div>
              </button>
            </SidebarTooltip>

            <SidebarTooltip text="Chats" isSidebarExpanded={isSidebarExpanded}>
              <button
                disabled={isProcessing}
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "chats" && "bg-black/10 dark:bg-white/10"} hover:bg-black/5 dark:hover:bg-white/10 justify-start`}
                onClick={() => setChatMode("chats")}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-[24px] h-[24px]">
                    <HiOutlineChatBubbleOvalLeft
                      size={18}
                      className="absolute top-0 left-0 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5"
                      strokeWidth={2}
                    />
                    <HiOutlineChatBubbleOvalLeft
                      size={18}
                      className="absolute bottom-0 right-0 scale-x-[-1] transition-transform duration-300 group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}
                  >
                    Chats
                  </span>
                </div>
              </button>
            </SidebarTooltip>
          </div>

          <SidebarTooltip text="Resume" isSidebarExpanded={isSidebarExpanded}>
            <button
              disabled={isProcessing}
              className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "resume" && "bg-black/10 dark:bg-white/10"} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
              onClick={() => onPremiumFeatureClick("resume")}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: 24, height: 24 }}
                >
                  <IoDocumentTextOutline
                    size={22}
                    className="transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />
                </div>
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}
                >
                  Resume
                </span>
                {isFreeTier && (
                  <LockKeyhole
                    size={14}
                    aria-label="Pro feature"
                    className={`ml-auto flex-shrink-0 text-violet-600 dark:text-purple-300 transition-opacity duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>
            </button>
          </SidebarTooltip>

          <SidebarTooltip text="Quiz" isSidebarExpanded={isSidebarExpanded}>
            <button
              disabled={isProcessing}
              className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "quiz" && "bg-black/10 dark:bg-white/10"} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
              onClick={() => onPremiumFeatureClick("quiz")}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: 24, height: 24 }}
                >
                  <MdOutlineQuiz
                    size={22}
                    className="transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-rotate-12"
                  />
                </div>
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}
                >
                  Quiz
                </span>
                {isFreeTier && (
                  <LockKeyhole
                    size={14}
                    aria-label="Pro feature"
                    className={`ml-auto flex-shrink-0 text-violet-600 dark:text-purple-300 transition-opacity duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>
            </button>
          </SidebarTooltip>

          <SidebarTooltip
            text="Flashcards"
            isSidebarExpanded={isSidebarExpanded}
          >
            <button
              disabled={isProcessing}
              className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "flashcards" && "bg-black/10 dark:bg-white/10"} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
              onClick={() => onPremiumFeatureClick("flashcards")}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: 24, height: 24 }}
                >
                  <TbCards
                    size={24}
                    className="transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-6"
                  />
                </div>
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}
                >
                  Flashcards
                </span>
                {isFreeTier && (
                  <LockKeyhole
                    size={14}
                    aria-label="Pro feature"
                    className={`ml-auto flex-shrink-0 text-violet-600 dark:text-purple-300 transition-opacity duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>
            </button>
          </SidebarTooltip>

          <div className={`pt-6 flex flex-col flex-grow min-h-[8rem]`}>
            <h3
              className={`flex-shrink-0 px-3 text-sm font-medium text-slate-500 dark:text-gray-400 transition-opacity duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}
            >
              Recents
            </h3>
            <div
              className={`mt-2 flex-grow space-y-2 overflow-y-auto scrollbar-custom transition-opacity duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}
            >
              {recents.map((chat) => (
                <div key={chat.chat_id} className="relative group">
                  <div
                    className={`flex items-center w-full rounded-lg transition-colors duration-200 ${currChatId === chat.chat_id && chatMode === "recents" ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
                  >
                    <button
                      onClick={() => onSelectChat(chat.chat_id)}
                      disabled={isProcessing}
                      className="flex-grow text-left p-3 text-sm truncate disabled:opacity-50 text-slate-700 dark:text-textDark"
                    >
                      {chat.chat_title || "Untitled"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === chat.chat_id ? null : chat.chat_id,
                        );
                      }}
                      disabled={isProcessing}
                      className="flex-shrink-0 p-2 mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-50 text-slate-600 dark:text-textDark"
                      aria-label="Chat options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  {openMenuId === chat.chat_id && (
                    <div className="absolute top-0 right-8 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-50 animate-fade-in-up-sm">
                      <button
                        onClick={() => {
                          onOpenRenameModal(chat);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-2 text-sm text-left text-slate-700 dark:text-textDark hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={14} />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(chat.chat_id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-2 text-sm text-left text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {openMenuId && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenMenuId(null)}
              ></div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-black/10 dark:border-white/10">
          <ProfileMenu
            placement="top-left"
            disabled={isProcessing}
            onSettingsClick={onSettingsClick}
            triggerClassName="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FaUserCircle
              size={30}
              className="flex-shrink-0 text-slate-600 dark:text-gray-300"
            />
            <div
              className={`min-w-0 overflow-hidden text-left transition-all duration-300 ${
                isSidebarExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              <span className="block truncate whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-gray-200">
                Profile
              </span>
              <span className="block truncate whitespace-nowrap text-xs capitalize text-slate-500 dark:text-slate-400">
                {tier ?? "Loading..."}
              </span>
            </div>
          </ProfileMenu>
        </div>
      </div>
    </div>
  );
}
