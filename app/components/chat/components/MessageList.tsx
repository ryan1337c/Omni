"use client";

import { useRef } from "react";

import type { ChatMessage } from "../types";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

type MessageListProps = {
  chatHistory: ChatMessage[];
  chatBoxRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isAutoScrollRef: React.MutableRefObject<boolean>;
  onTypingComplete: () => void;
};

export function MessageList({
  chatHistory,
  chatBoxRef,
  messagesEndRef,
  isAutoScrollRef,
  onTypingComplete,
}: MessageListProps) {
  const messageRefs = useRef<HTMLDivElement[]>([]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {chatHistory.map((chatMessage, index) => {
        if (chatMessage.role === "user") {
          return (
            <UserMessage
              key={index}
              chatMessage={chatMessage}
              messageRef={(reference) => {
                if (reference) messageRefs.current[index] = reference;
              }}
            />
          );
        }

        return (
          <AssistantMessage
            key={index}
            chatMessage={chatMessage}
            chatBoxRef={chatBoxRef}
            isAutoScrollRef={isAutoScrollRef}
            onTypingComplete={onTypingComplete}
          />
        );
      })}
      <div ref={messagesEndRef as React.RefObject<HTMLDivElement>}></div>
    </div>
  );
}
