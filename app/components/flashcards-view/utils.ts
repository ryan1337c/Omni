import type {
  FilterType,
  FlashcardItem,
  SortOption,
  SortOrder,
  LibraryItemKey,
} from "./types";

export function getProcessedItems(
  items: FlashcardItem[],
  searchTerm: string,
  filterType: FilterType,
  sortOption: SortOption,
  sortOrder: SortOrder,
  currFolder: FlashcardItem | null
): FlashcardItem[] {
  return items
    .filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "all" ? true : item.type === filterType;
      const matchFolder =
        item.parent_id === (currFolder ? currFolder.id : null);
      return matchesSearch && matchesType && matchFolder;
    })
    .sort((a, b) => {
      const dateA = new Date(a[sortOption] || 0).getTime();
      const dateB = new Date(b[sortOption] || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
}

export function libraryItemKey(item: Pick<FlashcardItem, "id" | "type">): LibraryItemKey {
  return `${item.type}:${item.id!}`;
}

export function parseLibraryItemKey(key: string): { type: "folder" | "deck"; id: number } | null {
  const match = /^(folder|deck):(\d+)$/.exec(key);
  if (!match) return null;
  return { type: match[1] as "folder" | "deck", id: Number(match[2]) };
}

/** Client-side guards. The RPC still enforces cycles and subtree depth. */
export function canMoveLibraryItem(
  item: FlashcardItem,
  target: { kind: "root" } | { kind: "folder"; id: number; depth: number },
  maxDepth: number,
): boolean {
  if (target.kind === "root") return item.parent_id != null;
  if (item.id === target.id && item.type === "folder") return false;
  if (item.parent_id === target.id) return false;
  if (item.type === "folder" && target.depth + 1 > maxDepth) return false;
  return true;
}
