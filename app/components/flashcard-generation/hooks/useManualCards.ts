"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import type { FormErrors } from "@/app/components/shared/generation/types";

import { CARD_LIMIT } from "../constants";
import type { ManualCard } from "../types";

export function useManualCards(
  setFormErrors: Dispatch<SetStateAction<FormErrors>>,
) {
  const [cards, setCards] = useState<ManualCard[]>([]);
  const [modifiedCardIds, setModifiedCardIds] = useState(new Set());
  const [deletedCardIds, setDeletedCardIds] = useState<number[]>([]);

  const addCard = () => {
    if (cards.length === CARD_LIMIT) return;
    const newCardId = Date.now().toString();
    setCards([...cards, { id: newCardId, front: "", back: "" }]);
    setModifiedCardIds((prev) => new Set(prev).add(newCardId));
  };

  const deleteCard = (id: string | number) => {
    const remainingCards = cards.filter((c) => c.id !== id);
    setCards(cards.filter((c) => c.id !== id));

    if (typeof id === "number") {
      setDeletedCardIds((prev) => [...prev, id]);
    }

    setModifiedCardIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    const allValid =
      remainingCards.length === 0 ||
      remainingCards.every((c) => c.front.trim() && c.back.trim());
    if (allValid) {
      setFormErrors((prev) => ({ ...prev, manual: undefined }));
    }
  };

  const updateCard = (
    id: string | number,
    field: "front" | "back",
    value: string,
  ) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setModifiedCardIds((prev) => new Set(prev).add(id));
    if (value.trim()) setFormErrors((prev) => ({ ...prev, manual: undefined }));
  };

  const confirmClearAll = () => {
    const dbCardIds = cards
      .filter((card) => typeof card.id === "number")
      .map((card) => card.id as number);
    setDeletedCardIds((prev) => [...prev, ...dbCardIds]);
    setCards([]);
    setModifiedCardIds(new Set());
    setFormErrors((prev) => ({ ...prev, manual: undefined }));
  };

  return {
    cards,
    setCards,
    modifiedCardIds,
    deletedCardIds,
    addCard,
    deleteCard,
    updateCard,
    confirmClearAll,
  };
}
