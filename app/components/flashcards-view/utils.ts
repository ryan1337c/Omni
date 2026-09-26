import type {
  FilterType,
  FlashcardItem,
  SortOption,
  SortOrder,
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
