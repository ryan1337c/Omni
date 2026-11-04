export {
  generateQuiz,
  prepareQuiz,
  buildQuizSystemPrompt,
  buildQuizUserPrompt,
  type GenerateQuizInput,
  type GenerateQuizOptions,
  type GeneratedQuestion,
  type GenerationSource,
  type PreparedQuiz,
  type PreparedSource,
  type QuizAiClient,
} from "./generateQuiz";
export type { QuizDocument } from "./extractDocumentText";
export {
  MAX_DOCUMENT_BYTES,
  resolveDocumentMimeType,
} from "./documentRules";
export { QuizGenerationError, type QuizGenerationErrorKind } from "./errors";
export { createOpenAiQuizClient, QUIZ_MODEL } from "./openAiQuizClient";
