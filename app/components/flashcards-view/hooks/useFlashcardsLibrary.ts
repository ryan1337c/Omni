"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";

import { MAX_FOLDER_DEPTH } from "../constants";
import type {
  ActiveDeck,
  FilterType,
  Flashcard,
  FlashcardEditorState,
  FlashcardItem,
  FlashcardsViewProps,
  SortOption,
  SortOrder,
} from "../types";
import { getProcessedItems } from "../utils";

export function useFlashcardsLibrary({
  isProcessing,
  setIsProcessing,
}: FlashcardsViewProps) {
  const [items, setItems] = useState<FlashcardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const authServices = new AuthServices();
  const publicServices = new PublicServices();
  const [userId, setUserId] = useState<string | null>(null);

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FlashcardItem | null>(null);
  const [itemToRename, setItemToRename] = useState<FlashcardItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [flashcardEditor, setFlashcardEditorState] =
    useState<FlashcardEditorState>({
      isOpen: false,
      mode: "create",
    });
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortOption, setSortOption] = useState<SortOption>("last_updated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const openCreateModal = () => {
    setFlashcardEditorState({ isOpen: true, mode: "create" });
  };

  const closeEditorModal = () => {
    setFlashcardEditorState({ isOpen: false, mode: "create" });
  };

  const openEditorModal = async (deck: FlashcardItem) => {
    setActiveMenuId(null);
    setIsProcessing(true);
    try {
      const flashcards = await publicServices.getFlashcards(deck.id);
      setFlashcardEditorState({
        isOpen: true,
        mode: "edit",
        data: { ...deck, flashcards },
      });
    } catch (e) {
      console.error(e);
      alert("Could not load deck for editing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeckClick = async (deck: FlashcardItem) => {
    setIsProcessing(true);
    try {
      const cardsData = await publicServices.getFlashcards(deck.id);
      const mappedCards: Flashcard[] = cardsData.map((c: {
        id: number;
        prompt: string;
        answer: string;
        parent_id: number;
      }) => ({
        id: c.id,
        prompt: c.prompt,
        answer: c.answer,
        parent_id: c.parent_id,
      }));

      setActiveDeck({
        title: deck.title,
        cards: mappedCards,
      });
    } catch (e) {
      console.error("Failed to open deck", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeckCreated = (deck: FlashcardItem) => {
    setItems((prev) => [...prev, deck]);
  };

  const handleDeckUpdated = (deck: FlashcardItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === deck.id ? deck : item))
    );
  };

  const [newFolderName, setNewFolderName] = useState("");
  const [path, setPath] = useState<FlashcardItem[]>([]);
  const currFolder = path[path.length - 1] || null;
  const parentFolder = path.length > 1 ? path[path.length - 2] : null;
  const backTargetName = parentFolder ? parentFolder.title : "Documents";
  const isAtMaxDepth = currFolder && currFolder.depth >= MAX_FOLDER_DEPTH;

  const processedItems = useMemo(
    () =>
      getProcessedItems(
        items,
        searchTerm,
        filterType,
        sortOption,
        sortOrder,
        currFolder
      ),
    [items, searchTerm, filterType, sortOption, sortOrder, currFolder]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchItems = async (id: string, folderId: number | null = null) => {
    try {
      const data = await publicServices.getFlashcardFolder(id, folderId);
      setItems(data as FlashcardItem[]);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await authServices.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          fetchItems(session.user.id, null);
        }
      } catch (error) {
        console.error("Error fetching session", error);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (activeMenuId) {
        const menuElement = document.getElementById(
          `menu-container-${activeMenuId}`
        );
        if (menuElement && !menuElement.contains(target)) setActiveMenuId(null);
      }

      if (
        isFilterMenuOpen &&
        filterRef.current &&
        !filterRef.current.contains(target)
      ) {
        setIsFilterMenuOpen(false);
      }

      if (isSortMenuOpen && sortRef.current && !sortRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId, isFilterMenuOpen, isSortMenuOpen]);

  const openDeleteModal = (item: FlashcardItem) => {
    setItemToDelete(item);
    setActiveMenuId(null);
  };

  const closeDeleteModal = () => setItemToDelete(null);

  const confirmDelete = async () => {
    if (!itemToDelete || !userId) return;
    try {
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      await publicServices.deleteFlashcardItem(
        userId,
        itemToDelete.id,
        itemToDelete.type
      );
    } catch (error) {
      console.log(error);
    } finally {
      closeDeleteModal();
    }
  };

  const openRenameModal = (item: FlashcardItem) => {
    setItemToRename(item);
    setRenameValue(item.title);
    setActiveMenuId(null);
  };

  const closeRenameModal = () => {
    setItemToRename(null);
    setRenameValue("");
  };

  const handleRename = async () => {
    if (!itemToRename || !userId || !renameValue.trim()) return;

    try {
      const updates = {
        title: renameValue,
        itemType: itemToRename.type,
      };

      await publicServices.updateFlashcardItems(
        userId,
        itemToRename.id,
        updates
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemToRename.id
            ? {
                ...item,
                title: renameValue,
                last_updated: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error) {
      console.log("Error renaming:", error);
    } finally {
      closeRenameModal();
    }
  };

  const toggleStar = async (currItem: FlashcardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updates = { isStarred: !currItem.isStarred, itemType: currItem.type };
      await publicServices.updateFlashcardItems(userId, currItem.id, updates);
      setItems((prev) =>
        prev.map((item) =>
          item.id === currItem.id
            ? { ...item, isStarred: !item.isStarred }
            : item
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateFolder = async () => {
    if (
      !newFolderName.trim() ||
      (currFolder && currFolder.depth === MAX_FOLDER_DEPTH)
    )
      return;
    const parent_id = currFolder ? currFolder.id : null;
    const newFolder: FlashcardItem = {
      type: "folder",
      title: newFolderName,
      count: 0,
      depth: currFolder ? currFolder.depth + 1 : 0,
      isStarred: false,
      parent_id: parent_id,
    };
    try {
      const data = await publicServices.createFolder(userId, newFolder, parent_id);
      const folderData = {
        id: data.id,
        type: "folder",
        title: data.title,
        count: data.count,
        depth: data.depth,
        isStarred: data.starred,
        created_at: data.created_at,
        parent_id: data.parent_id,
        userId: data.user_id,
        last_updated: data.last_updated,
      };

      setItems([folderData as FlashcardItem, ...items]);
    } catch (error) {
      console.log(error);
    }
    setNewFolderName("");
    setIsFolderModalOpen(false);
  };

  const handleFolderClick = (folder: FlashcardItem) => {
    setPath((prev) => [...prev, folder]);
    fetchItems(userId!, folder.id);
    setSearchTerm("");
  };

  const handleGoBack = () => {
    const newPath = [...path];
    newPath.pop();
    setPath(newPath);

    const prevFolder = newPath[newPath.length - 1] || null;
    fetchItems(userId!, prevFolder ? prevFolder.id! : null);
  };

  return {
    isProcessing,
    setIsProcessing,
    activeDeck,
    setActiveDeck,
    isNewMenuOpen,
    setIsNewMenuOpen,
    searchTerm,
    setSearchTerm,
    currFolder,
    backTargetName,
    isAtMaxDepth,
    filterRef,
    sortRef,
    filterType,
    setFilterType,
    sortOption,
    setSortOption,
    sortOrder,
    setSortOrder,
    isFilterMenuOpen,
    setIsFilterMenuOpen,
    isSortMenuOpen,
    setIsSortMenuOpen,
    processedItems,
    activeMenuId,
    setActiveMenuId,
    openCreateModal,
    openEditorModal,
    handleDeckClick,
    handleFolderClick,
    toggleStar,
    openRenameModal,
    openDeleteModal,
    mounted,
    isFolderModalOpen,
    setIsFolderModalOpen,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    itemToRename,
    renameValue,
    setRenameValue,
    closeRenameModal,
    handleRename,
    itemToDelete,
    closeDeleteModal,
    confirmDelete,
    flashcardEditor,
    closeEditorModal,
    handleDeckCreated,
    handleDeckUpdated,
    userId,
    handleGoBack,
  };
}

export type FlashcardsLibrary = ReturnType<typeof useFlashcardsLibrary>;
