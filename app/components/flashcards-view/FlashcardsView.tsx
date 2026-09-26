"use client";

import FlashcardGenerationModal from "@/app/components/flashcard-generation";
import DeckView from "@/app/components/DeckView";

import CreateNewTile from "./components/CreateNewTile";
import DeleteItemModal from "./components/DeleteItemModal";
import FolderCreateModal from "./components/FolderCreateModal";
import LibraryBreadcrumb from "./components/LibraryBreadcrumb";
import LibraryHeader from "./components/LibraryHeader";
import LibraryItemCard from "./components/LibraryItemCard";
import LibraryToolbar from "./components/LibraryToolbar";
import RenameItemModal from "./components/RenameItemModal";
import { useFlashcardsLibrary } from "./hooks/useFlashcardsLibrary";
import type { FlashcardsViewProps } from "./types";

export default function FlashcardsView(props: FlashcardsViewProps) {
  const library = useFlashcardsLibrary(props);

  if (library.activeDeck) {
    return (
      <DeckView
        deckTitle={library.activeDeck.title}
        cards={library.activeDeck.cards}
        onExit={() => library.setActiveDeck(null)}
      />
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full text-slate-800 dark:text-gray-200 overflow-y-auto custom-scrollbar animate-fade-in-sm">
      {library.isNewMenuOpen && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => library.setIsNewMenuOpen(false)}
        ></div>
      )}

      <div className="w-full max-w-7xl mx-auto py-4 px-6 md:p-10 space-y-6">
        <LibraryBreadcrumb
          showBack={Boolean(library.currFolder)}
          backTargetName={library.backTargetName}
          onGoBack={library.handleGoBack}
        />

        <LibraryHeader
          currFolder={library.currFolder}
          searchTerm={library.searchTerm}
          onSearchChange={library.setSearchTerm}
        />

        <LibraryToolbar
          filterRef={library.filterRef}
          sortRef={library.sortRef}
          filterType={library.filterType}
          setFilterType={library.setFilterType}
          sortOption={library.sortOption}
          setSortOption={library.setSortOption}
          sortOrder={library.sortOrder}
          setSortOrder={library.setSortOrder}
          isFilterMenuOpen={library.isFilterMenuOpen}
          setIsFilterMenuOpen={library.setIsFilterMenuOpen}
          isSortMenuOpen={library.isSortMenuOpen}
          setIsSortMenuOpen={library.setIsSortMenuOpen}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
          <CreateNewTile
            isNewMenuOpen={library.isNewMenuOpen}
            setIsNewMenuOpen={library.setIsNewMenuOpen}
            isAtMaxDepth={library.isAtMaxDepth}
            onCreateDeck={library.openCreateModal}
            onCreateFolder={() => {
              library.setIsNewMenuOpen(false);
              library.setIsFolderModalOpen(true);
            }}
          />

          {library.processedItems.map((item) => (
            <LibraryItemCard
              key={item.id}
              item={item}
              isMenuOpen={library.activeMenuId === item.id}
              isNewMenuOpen={library.isNewMenuOpen}
              onToggleMenu={(open) =>
                library.setActiveMenuId(open ? item.id! : null)
              }
              onToggleStar={library.toggleStar}
              onRename={library.openRenameModal}
              onEditDeck={library.openEditorModal}
              onDelete={library.openDeleteModal}
              onFolderClick={library.handleFolderClick}
              onDeckClick={library.handleDeckClick}
            />
          ))}
        </div>
      </div>

      <FolderCreateModal
        mounted={library.mounted}
        isOpen={library.isFolderModalOpen}
        newFolderName={library.newFolderName}
        onNameChange={library.setNewFolderName}
        onClose={() => {
          library.setNewFolderName("");
          library.setIsFolderModalOpen(false);
        }}
        onCreate={library.handleCreateFolder}
      />

      <RenameItemModal
        mounted={library.mounted}
        item={library.itemToRename}
        renameValue={library.renameValue}
        onRenameValueChange={library.setRenameValue}
        onClose={library.closeRenameModal}
        onSave={library.handleRename}
      />

      <DeleteItemModal
        mounted={library.mounted}
        item={library.itemToDelete}
        onClose={library.closeDeleteModal}
        onConfirm={library.confirmDelete}
      />

      {library.flashcardEditor.isOpen && (
        <FlashcardGenerationModal
          onClose={library.closeEditorModal}
          isProcessing={library.isProcessing}
          setIsProcessing={library.setIsProcessing}
          onDeckCreated={library.handleDeckCreated}
          onDeckUpdated={library.handleDeckUpdated}
          userId={library.userId}
          currFolderId={library.currFolder ? library.currFolder.id! : null}
          initialData={library.flashcardEditor.data}
          editMode={library.flashcardEditor.mode === "edit"}
        />
      )}
    </div>
  );
}
