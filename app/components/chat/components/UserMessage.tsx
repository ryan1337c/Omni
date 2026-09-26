"use client";

import chatStyles from "@/app/components/chatBubble.module.css";

import type { ChatMessage } from "../types";

type UserMessageProps = {
  chatMessage: ChatMessage;
  messageRef: (reference: HTMLDivElement | null) => void;
};

export function UserMessage({ chatMessage, messageRef }: UserMessageProps) {
  const hasImages =
    chatMessage.imagesData && chatMessage.imagesData.length > 0;

  return (
    <div className="flex justify-end w-full mb-4">
      <div
        ref={messageRef}
        className={`max-w-[70%] md:max-w-[500px] w-fit text-sm text-left rounded-lg p-3 bg-gray-200 dark:bg-userChatBg dark:text-textDark break-words ${chatStyles.talkBubbleUser}`}
      >
        {hasImages && (
          <div className="flex flex-wrap gap-2 mb-2">
            {chatMessage.imagesData?.map((image, i) => (
              <img
                key={i}
                src={image.public_url}
                alt="User upload"
                className="w-full h-auto max-h-80 rounded-md object-contain"
              />
            ))}
          </div>
        )}

        <div className="whitespace-pre-wrap">{chatMessage.content}</div>
      </div>
    </div>
  );
}
