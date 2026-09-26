export type FlashcardGenerationModalProps = {
  onClose: () => void;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onDeckCreated: (deck: any) => void;
  onDeckUpdated: (deck: any) => void;
  userId: string | null;
  currFolderId: number | null;
  initialData?: any;
  editMode: boolean;
};

export type ManualCard = {
  id: string | number;
  front: string;
  back: string;
};
