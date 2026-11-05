import type { StoredFigure } from "@/lib/quiz/figureRules";

export type QuizGenerationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onQuizCreated: (quiz: any) => void;
  editMode?: boolean;
  initialData?: any;
  onQuizUpdated: (quiz: any) => void;
};

/** A Figure in the editor: already in storage, or picked from the device and uploaded on save. */
export type FigureDraft =
  | ({ kind: "stored" } & StoredFigure)
  | { kind: "picked"; file: File; previewUrl: string };

export type ManualQuestion = {
  id: string;
  question_text: string;
  type: "multiple_choice" | "short_answer";
  choices: string[];
  correct_index: number;
  explanation: string;
  figures: FigureDraft[];
};
