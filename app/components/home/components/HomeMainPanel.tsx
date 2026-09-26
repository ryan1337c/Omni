"use client";

import { Menu, Pencil } from "lucide-react";

import Chat from "@/app/components/chat";
import ChatsView from "@/app/components/ChatsView";
import FlashcardsView from "@/app/components/flashcards-view";
import QuizView from "@/app/components/QuizView";
import ResumeBuild from "@/app/components/ResumeBuild";

import type { RecentChat } from "../types";

type HomeMainPanelProps = {
  chatMode: string;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  currentChatTitle: string;
  recents: RecentChat[];
  currChatId: string | null;
  setCurrChatId: (id: string | null) => void;
  setRecents: React.Dispatch<React.SetStateAction<RecentChat[]>>;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onMobileSidebarOpen: () => void;
  onOpenRenameModal: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function HomeMainPanel({
  chatMode,
  isProcessing,
  setIsProcessing,
  currentChatTitle,
  recents,
  currChatId,
  setCurrChatId,
  setRecents,
  openMenuId,
  setOpenMenuId,
  onMobileSidebarOpen,
  onOpenRenameModal,
  onNewChat,
  onSelectChat,
  onDelete,
}: HomeMainPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-chatDark transition-transform duration-300 ease-in-out z-10">
      <header
        className={`flex-shrink-0 flex items-center p-4 relative z-30 ${chatMode !== "recents" ? "md:hidden" : ""}`}
      >
        <div className="md:hidden mr-2 sm:mr-4">
          <button
            onClick={onMobileSidebarOpen}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-textDark hover:dark:bg-gray-50/5"
          >
            <Menu size={24} />
          </button>
        </div>

        {chatMode === "recents" && (
          <div className="flex-1 flex items-center animate-fade-in-sm min-w-0 max-w-[33.33%]">
            <button
              disabled={isProcessing}
              onClick={onOpenRenameModal}
              className="flex items-center gap-2 text-lg w-full font-semibold text-gray-800 dark:text-textDark truncate group disabled:cursor-not-allowed"
            >
              <span className="truncate min-w-0">{currentChatTitle}</span>
              <Pencil
                size={16}
                className="text-gray-400 opacity-100 transition-opacity flex-shrink-0"
              />
            </button>
          </div>
        )}
      </header>

      {chatMode === "chats" ? (
        <ChatsView
          recents={recents}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          isProcessing={isProcessing}
          onDeleteChat={onDelete}
        />
      ) : chatMode === "resume" ? (
        <ResumeBuild
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      ) : chatMode === "quiz" ? (
        <QuizView
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      ) : chatMode === "flashcards" ? (
        <FlashcardsView
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      ) : (
        <Chat
          setRecents={setRecents}
          currChatId={currChatId}
          setCurrChatId={setCurrChatId}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}

      {openMenuId && (
        <div
          className="absolute inset-0 z-20 md:left-64"
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}
    </div>
  );
}
