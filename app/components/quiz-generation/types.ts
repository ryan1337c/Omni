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

export type ManualQuestion = {
  id: string;
  question_text: string;
  type: "multiple_choice" | "short_answer";
  choices: string[];
  correct_index: number;
};
