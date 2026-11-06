export const GENERATION_SOURCE_KINDS = ["fromScratch", "notes"] as const;

export type GenerationSourceKind = (typeof GENERATION_SOURCE_KINDS)[number];

export function isGenerationSourceKind(value: unknown): value is GenerationSourceKind {
  return GENERATION_SOURCE_KINDS.includes(value as GenerationSourceKind);
}
