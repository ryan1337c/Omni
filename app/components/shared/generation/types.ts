export type GenerationMode = "manual" | "ai";

export type FormErrors = {
  title?: string;
  description?: string;
  topic?: string;
  source?: string;
  manual?: string;
};
