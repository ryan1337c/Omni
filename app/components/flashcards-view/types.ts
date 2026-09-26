import type React from "react";

export type Flashcard = {
  id: number;
  parent_id: number;
  prompt: string;
  answer: string;
};

export interface FlashcardItem {
  id?: number;
  lastStudied?: string;
  created_at?: string;
  last_updated?: string;
  parent_id?: number | null;
  mode?: string | null;
  description?: string;
  flashcards?: Flashcard[];
  depth: number;
  title: string;
  count: number;
  isStarred: boolean;
  type: "folder" | "deck";
}

export type FlashcardsViewProps = {
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};

export type FlashcardEditorState = {
  data?: FlashcardItem;
  isOpen: boolean;
  mode: "create" | "edit";
};

export type FilterType = "all" | "folder" | "deck";
export type SortOption = "last_updated" | "created_at";
export type SortOrder = "asc" | "desc";

export type ActiveDeck = {
  title: string;
  cards: Flashcard[];
};
