"use client";

import { createPortal } from "react-dom";

import {
  ClearConfirmOverlay,
  DescriptionField,
  GenerationModalFooter,
  GenerationModalShell,
  ModeSelector,
  TitleField,
} from "@/app/components/shared/generation";

import FlashcardAiFields from "./components/FlashcardAiFields";
import ManualCardsEditor from "./components/ManualCardsEditor";
import { useFlashcardGeneration } from "./hooks/useFlashcardGeneration";
import { usePortalLock } from "./hooks/usePortalLock";
import type { FlashcardGenerationModalProps } from "./types";

export default function FlashcardGenerationModal(
  props: FlashcardGenerationModalProps,
) {
  const deck = useFlashcardGeneration(props);
  const mounted = usePortalLock();

  if (!mounted) return null;

  return createPortal(
    <GenerationModalShell
      title={deck.editMode ? "Edit Deck" : "Create New Deck"}
      isProcessing={props.isProcessing}
      processingLabel="Processing Deck..."
      onClose={deck.handleClose}
      serverError={deck.serverError}
      showUpgradeCta={deck.showUpgradeCta}
      onDismissError={deck.dismissServerError}
      footer={
        <GenerationModalFooter
          isProcessing={props.isProcessing}
          editMode={deck.editMode}
          generateLabel="Generate Deck"
          onCancel={deck.handleClose}
          onSubmit={deck.handleGenerate}
        />
      }
      overlay={
        deck.isClearConfirmOpen ? (
          <ClearConfirmOverlay
            title="Clear all cards?"
            description="This will delete all card content you've entered. This action cannot be undone."
            onCancel={() => deck.setIsClearConfirmOpen(false)}
            onConfirm={deck.confirmClearAll}
          />
        ) : null
      }
    >
      <TitleField
        label="Deck Title"
        placeholder="e.g., Biochemistry Midterm"
        value={deck.title}
        error={deck.formErrors.title}
        isProcessing={props.isProcessing}
        onChange={deck.handleTitleChange}
      />

      <DescriptionField
        placeholder="What is this deck about?"
        value={deck.description}
        isProcessing={props.isProcessing}
        onChange={deck.setDescription}
      />

      {!deck.editMode && (
        <ModeSelector
          mode={deck.mode}
          isProcessing={props.isProcessing}
          aiDescription="Auto-generated cards"
          onChange={deck.handleModeChange}
        />
      )}

      {deck.mode === "manual" ? (
        <ManualCardsEditor
          cards={deck.cards}
          manualError={deck.formErrors.manual}
          isProcessing={props.isProcessing}
          onClearAll={deck.handleClearAllClick}
          onAddCard={deck.addCard}
          onDeleteCard={deck.deleteCard}
          onUpdateCard={deck.updateCard}
        />
      ) : (
        <FlashcardAiFields
          topic={deck.topic}
          topicError={deck.formErrors.topic}
          cardCount={deck.cardCount}
          isProcessing={props.isProcessing}
          onTopicChange={deck.handleTopicChange}
          onCardCountChange={deck.setCardCount}
          onCardCountBlur={deck.handleCardCountBlur}
        />
      )}
    </GenerationModalShell>,
    document.body,
  );
}
