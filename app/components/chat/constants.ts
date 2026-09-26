import type { ChatModel } from "./types";

export const GENERATED_IMAGE_CONTENT = "Here is the generated image:";
export const MISSING_IMAGE_PLACEHOLDER_URL = "/image-placeholder.svg";
export const TEXTAREA_MAX_HEIGHT = 200;

export const MODELS: ChatModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's most capable multimodal model",
    tier: "gpt4",
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Smart, efficient model for everyday use",
    tier: "sonnet",
  },
  {
    id: "deep-seek",
    name: "DeepSeek v4 Flash",
    description: "Most capable model for complex tasks",
    tier: "deepseek",
  },
];

export const TOOLS = [
  { name: "Generate Image", icon: "", id: "image" },
  { name: "Reasoning", icon: "", id: "reasoning" },
];

export const UPLOAD_OPTION = {
  name: "Add photos & files",
  icon: "",
  id: "upload",
};
