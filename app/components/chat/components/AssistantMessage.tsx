"use client";

import { FaRobot } from "react-icons/fa";
import Image from "next/image";

import TypeWriter, {
  parseContentSegments,
  renderContentSegments,
} from "@/app/components/TypeWriter";

import { downloadImage } from "../api";
import { MISSING_IMAGE_PLACEHOLDER_URL } from "../constants";
import type { ChatMessage } from "../types";
import { formatMarkdown } from "../utils";

type AssistantMessageProps = {
  chatMessage: ChatMessage;
  chatBoxRef: React.RefObject<HTMLDivElement | null>;
  isAutoScrollRef: React.MutableRefObject<boolean>;
  onTypingComplete: () => void;
};

export function AssistantMessage({
  chatMessage,
  chatBoxRef,
  isAutoScrollRef,
  onTypingComplete,
}: AssistantMessageProps) {
  return (
    <div className="flex justify-start w-full mb-4 items-start gap-3">
      <FaRobot
        size="24px"
        className="mt-1.5 flex-shrink-0 text-gray-600 dark:text-textDark"
      />
      <div
        className={`
                              min-w-0 flex-1 rounded-lg
                              text-sm text-left
                              p-3
                              bg-white
                              dark:bg-chatDark
                              text-gray-800
                              dark:text-textDark
                              break-words
                              max-full
                            `}
      >
        {chatMessage.loading ? (
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full bg-gray-500 animate-pulse"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="h-2 w-2 rounded-full bg-gray-500 animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="h-2 w-2 rounded-full bg-gray-500 animate-pulse"
              style={{ animationDelay: "0.3s" }}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {chatMessage.isNew ? (
              <TypeWriter
                content={chatMessage.content}
                baseSpeed={5}
                containerRef={
                  chatBoxRef as React.RefObject<HTMLDivElement>
                }
                isAutoScrollRef={isAutoScrollRef}
                onComplete={onTypingComplete}
                formatMarkdown={formatMarkdown}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm max-w-none prose-sm">
                {renderContentSegments(
                  parseContentSegments(chatMessage.content),
                  formatMarkdown,
                )}
              </div>
            )}

            {chatMessage.imagesData && chatMessage.imagesData.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {chatMessage.imagesData.map((image, i) => (
                  <div
                    key={i}
                    className="relative w-64 h-64 rounded-md overflow-hidden group"
                  >
                    <Image
                      src={image.public_url}
                      alt={
                        image.public_url === MISSING_IMAGE_PLACEHOLDER_URL
                          ? "Image unavailable"
                          : "Generated Content"
                      }
                      width={256}
                      height={256}
                      priority
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                    {image.public_url !== MISSING_IMAGE_PLACEHOLDER_URL && (
                      <button
                        onClick={() => downloadImage(image.public_url)}
                        className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60 text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        Download Image
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
