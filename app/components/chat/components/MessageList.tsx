"use client";

import { memo } from "react";

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



function MessageListInner({
  chatHistory,
  chatBoxRef,
  messagesEndRef,
  isAutoScrollRef,
  onTypingComplete,
}: MessageListProps) {

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {chatHistory.map((chatMessage, index) => {
        if (chatMessage.role === "user") {
          return <UserMessage key={index} chatMessage={chatMessage}/>
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

export const MessageList = memo(MessageListInner);