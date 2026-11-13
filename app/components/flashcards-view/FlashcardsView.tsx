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

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { Files, Folder } from "lucide-react";

import { MAX_FOLDER_DEPTH } from "./constants";
import type { FlashcardItem, FlashcardsViewProps } from "./types";
import { canMoveLibraryItem, libraryItemKey } from "./utils";

export default function FlashcardsView(props: FlashcardsViewProps) {
  const library = useFlashcardsLibrary(props);

  // Drag starts only after the pointer moves 5px, so normal clicks still open folders/decks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const [activeItem, setActiveItem] = useState<FlashcardItem | null>(null);

  function onDragStart({ active }: DragStartEvent) {
    // Each card passes its item in `data`, so read it back here
    setActiveItem((active.data.current?.item as FlashcardItem) ?? null);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setOverCrumb(false)
    setActiveItem(null);
    const item = active.data.current?.item as FlashcardItem | undefined;
    if (!item || !over) return; // dropped on nothing

    // Dropped on "Documents" in the breadcrumb, which moves it to the root
    if (over.id === "root") {
      if (canMoveLibraryItem(item, { kind: "root" }, MAX_FOLDER_DEPTH)) {
        await library.handleMoveItem(item, null);
      }
      return;
    }

    // Dropped on a folder, either a card in the grid or a crumb in the breadcrumb
    const target = over.data.current?.item as FlashcardItem | undefined;
    if (!target || target.type !== "folder") return;

    if (
      canMoveLibraryItem(
        item,
        { kind: "folder", id: target.id!, depth: target.depth },
        MAX_FOLDER_DEPTH,
      )
    ) {
      await library.handleMoveItem(item, target.id!);
    }
  }

  // Drop animation side effects
  const dropAnimation: DropAnimation = {
    duration: 250,
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)", // slight overshoot, feels springy
    keyframes: ({ transform }) => [
      { transform: `translate(${transform.initial.x}px, ${transform.initial.y}px) scale(1)`, opacity: 1 },
      { transform: `translate(${transform.final.x}px, ${transform.final.y}px) scale(1.15)`, opacity: 0 },
    ],
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } }, // keeps the original faded until the preview lands
    }),
  };

  // Collision detection
  const collisionDetection: CollisionDetection = (args) => {
    const hits = pointerWithin(args);        // only what's directly under the cursor
    return hits.length ? hits : rectIntersection(args); // keyboard drags have no pointer
  };

  // Make preview fade and shrink over the breadcrumb
  const [overCrumb, setOverCrumb] = useState(false);
  function onDragOver({ over }: DragOverEvent) {
    const id = String(over?.id ?? "");
    setOverCrumb(id === "root" || id.startsWith("crumb-"));
  }

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
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => {setActiveItem(null); setOverCrumb(false)}}
    collisionDetection={collisionDetection} onDragOver={onDragOver}>
      <div className="relative flex flex-col h-full w-full text-slate-800 dark:text-gray-200 overflow-y-auto custom-scrollbar animate-fade-in-sm">
        {library.isNewMenuOpen && (
          <div
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => library.setIsNewMenuOpen(false)}
          ></div>
        )}

        <div className="w-full max-w-7xl mx-auto py-4 px-6 md:p-10 space-y-6">
          <LibraryBreadcrumb 
            path={library.path} 
            onNavigate={library.navigateTo} 
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
                key={libraryItemKey(item)}
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

      {/* Floating preview that follows the cursor */}
      <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={dropAnimation}>
        {activeItem ? (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-grabbing transition-all duration-150 ${
            overCrumb ? "w-32 opacity-40 scale-90" : "w-56 opacity-100"
          }`}>
            <div className={`p-2 rounded-lg ${activeItem.type === "folder" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-violet-100 text-violet-600 dark:bg-btnDark/20 dark:text-indigo-300"}`}>
              {activeItem.type === "folder" ? <Folder size={18} /> : <Files size={18} />}
            </div>
            <span className="font-bold text-sm line-clamp-1">{activeItem.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
