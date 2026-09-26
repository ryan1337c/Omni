import {
  GENERATED_IMAGE_CONTENT,
  MISSING_IMAGE_PLACEHOLDER_URL,
} from "./constants";
import type { ChatMessage, FileWithPreview } from "./types";

export const tierDotColor = (tier: string) =>
  tier === "sonnet"
    ? "bg-orange-500"
    : tier === "gpt4"
      ? "bg-green-500"
      : tier === "deepseek"
        ? "bg-blue-500"
        : "bg-gray-500";

export const filterForOpenAI = (history: ChatMessage[]) => {
  return history.map(({ role, content }) => ({ role, content }));
};

export const getUnsupportedRequestReason = (
  tool: string,
  filesToUpload: FileWithPreview[],
  selectedModel: string,
): string | null => {
  if (tool === "image") {
    if (filesToUpload.length > 0) {
      return "As of now, we do not support image generation with uploads";
    }
    if (selectedModel !== "gpt-4o") {
      return `As of now, we do not support image generation with ${selectedModel}`;
    }
  }
  return null;
};

export function replaceLastMessage(
  history: ChatMessage[],
  patch: Partial<ChatMessage>,
): ChatMessage[] {
  const updatedHistory = [...history];
  const lastMessageIndex = updatedHistory.length - 1;
  if (lastMessageIndex < 0) {
    return updatedHistory;
  }
  updatedHistory[lastMessageIndex] = {
    ...updatedHistory[lastMessageIndex],
    ...patch,
  };
  return updatedHistory;
}

export function formatFetchedMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg) => {
    const sortedImages = [...(msg.imagesData ?? [])].sort(
      (a, b) => a.order_index - b.order_index,
    );

    return {
      role: msg.role,
      content: msg.content,
      loading: false,
      isNew: false,
      imagesData:
        sortedImages.length > 0
          ? sortedImages
          : msg.role === "assistant" && msg.content === GENERATED_IMAGE_CONTENT
            ? [
                {
                  id: "local-placeholder",
                  public_url: MISSING_IMAGE_PLACEHOLDER_URL,
                  storage_path: "",
                  order_index: 0,
                },
              ]
            : sortedImages,
    };
  });
}

export const formatMarkdown = (text: string): string => {
  // let processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
  //   const lang = language || 'text';
  //   const blockId = `code-${nanoid()}`
  //   return `<div class="code-block border border-gray-200 dark:border-none rounded-lg overflow-hidden bg-gray-50 dark:bg-codeBgDark"><div class="flex justify-between items-center px-3 py-0.5 border-b border-gray-200 dark:border-slate-600"><span class="text-xs text-gray-600 dark:text-textDark font-medium">${lang}</span><button class="copy-btn dark:bg-codeBgDark dark:text-textDark hover:bg-[#e5e7eb] dark:hover:bg-white/10" data-block-id="${blockId}">Copy</button></div><div class="overflow-x-auto"><pre class="p-4"><code id="${blockId}" class="text-sm font-mono text-gray-800 dark:text-textDark">${escapeHtml(code.trim())}</code></pre></div></div>`;
  // });

  let processedText = text;

  processedText = processedText
    .replace(/^#{6} (.*$)/gm, '<h6 class="text-sm font-medium mb-1 mt-3">$1</h6>')
    .replace(/^#{5} (.*$)/gm, '<h5 class="text-sm font-medium mb-1 mt-3">$1</h5>')
    .replace(/^#{4} (.*$)/gm, '<h4 class="text-base font-medium mb-2 mt-3">$1</h4>')
    .replace(/^#{3} (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
    .replace(/^#{2} (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>');

  return processedText
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code class="bg-gray-100 dark:bg-chatDark px-1 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400">$1</code>',
    );
};
