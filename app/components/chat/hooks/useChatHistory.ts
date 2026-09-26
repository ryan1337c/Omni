"use client";

import { useEffect, useState } from "react";

import { PublicServices } from "@/lib/publicServices";

import type { ChatMessage } from "../types";
import { formatFetchedMessages } from "../utils";

export function useChatHistory(currChatId: string | null) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const publicServices = new PublicServices();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currChatId) {
        setChatHistory([]);
        return;
      }

      if (chatHistory.length === 0) {
        setHistoryLoading(true);
      }

      try {
        const messages = await publicServices.fetchMessages(currChatId);

        if (messages.length === 0 && chatHistory.length > 0) {
          return;
        }

        const formattedHistory = formatFetchedMessages(
          messages as ChatMessage[],
        );

        console.log(formattedHistory);

        setChatHistory(formattedHistory);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchMessages();
  }, [currChatId]);

  return { chatHistory, setChatHistory, historyLoading };
}
