"use client";

import { useEffect, useState } from "react";

import type {
  FormErrors,
  GenerationMode,
} from "@/app/components/shared/generation/types";
import {
  formatInsufficientCreditsMessage,
  getInsufficientCreditsInfo,
  shouldOfferCreditUpgrade,
} from "@/lib/credits/usageClient";

export function useGenerationForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<GenerationMode>("ai");
  const [topic, setTopic] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showUpgradeCta, setShowUpgradeCta] = useState(false);
  const [isCreditError, setIsCreditError] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (serverError && !isCreditError) {
      const timer = setTimeout(() => setServerError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [serverError, isCreditError]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim()) setFormErrors((prev) => ({ ...prev, title: undefined }));
  };

  const handleTopicChange = (value: string) => {
    setTopic(value);
    if (value.trim()) setFormErrors((prev) => ({ ...prev, topic: undefined }));
  };

  const handleModeChange = (next: GenerationMode) => {
    setMode(next);
    setFormErrors({});
  };

  const beginSubmit = () => {
    setFormErrors({});
    setServerError(null);
    setShowUpgradeCta(false);
    setIsCreditError(false);
  };

  const dismissServerError = () => {
    setServerError(null);
    setShowUpgradeCta(false);
    setIsCreditError(false);
  };

  const applyCreditError = (
    status: number,
    data: unknown,
    tier: string | null | undefined,
  ) => {
    const creditInfo = getInsufficientCreditsInfo(status, data);
    if (!creditInfo) return false;
    setServerError(formatInsufficientCreditsMessage(creditInfo, tier));
    setShowUpgradeCta(shouldOfferCreditUpgrade(tier));
    setIsCreditError(true);
    return true;
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    mode,
    setMode,
    topic,
    setTopic,
    formErrors,
    setFormErrors,
    serverError,
    setServerError,
    showUpgradeCta,
    isCreditError,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    handleTitleChange,
    handleTopicChange,
    handleModeChange,
    beginSubmit,
    dismissServerError,
    applyCreditError,
  };
}
