"use client";

import { useCallback, useEffect, useRef } from "react";

export function useChatScroll(
  chatMode: string,
  chatHistory: { length: number },
  chatBoxRef: React.RefObject<HTMLDivElement | null>,
  messagesEndRef: React.RefObject<HTMLDivElement | null>,
) {
  const isAutoScroll = useRef(true);

  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      const targetMessage = messagesEndRef.current;
      if (chatBoxRef.current && targetMessage) {
        const chatBox = chatBoxRef.current;
        const messageOffsetTop = targetMessage.offsetTop;

        chatBox.scrollTo({
          top: messageOffsetTop,
          behavior: behavior,
        });
      }
    },
    [chatBoxRef, messagesEndRef],
  );

  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToBottom("auto");
    }
  }, [chatHistory]);

  useEffect(() => {
    scrollToBottom();

    const chatContainer = chatBoxRef.current;
    if (!chatContainer) {
      console.log("Chat container not ready yet");
      return;
    }

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;

      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1;

      isAutoScroll.current = isAtBottom;
    };
    chatContainer.addEventListener("scroll", onScroll);
    return () => chatContainer.removeEventListener("scroll", onScroll);
  }, [chatMode]);

  return { scrollToBottom, isAutoScroll };
}
