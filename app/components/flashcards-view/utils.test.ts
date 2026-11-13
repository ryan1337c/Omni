import { describe, expect, it } from "vitest";

import { MAX_FOLDER_DEPTH } from "./constants";
import type { FlashcardItem } from "./types";
import {
  canMoveLibraryItem,
  libraryItemKey,
  parseLibraryItemKey,
} from "./utils";

// Small factory so each test only spells out the fields it cares about
function makeItem(overrides: Partial<FlashcardItem> = {}): FlashcardItem {
  return {
    id: 1,
    type: "deck",
    title: "Item",
    count: 0,
    depth: 0,
    isStarred: false,
    parent_id: null,
    ...overrides,
  };
}

const folderTarget = (id: number, depth: number) =>
  ({ kind: "folder", id, depth }) as const;

describe("libraryItemKey", () => {
  it("prefixes the id with the item type", () => {
    expect(libraryItemKey(makeItem({ id: 12, type: "folder" }))).toBe("folder:12");
    expect(libraryItemKey(makeItem({ id: 12, type: "deck" }))).toBe("deck:12");
  });

  it("gives a folder and a deck with the same id different keys", () => {
    expect(libraryItemKey(makeItem({ id: 5, type: "folder" }))).not.toBe(
      libraryItemKey(makeItem({ id: 5, type: "deck" })),
    );
  });
});

describe("parseLibraryItemKey", () => {
  it("reads back a folder key and a deck key", () => {
    expect(parseLibraryItemKey("folder:12")).toEqual({ type: "folder", id: 12 });
    expect(parseLibraryItemKey("deck:7")).toEqual({ type: "deck", id: 7 });
  });

  it("round-trips with libraryItemKey", () => {
    const item = makeItem({ id: 42, type: "folder" });
    expect(parseLibraryItemKey(libraryItemKey(item))).toEqual({
      type: "folder",
      id: 42,
    });
  });

  it("returns null for anything that isn't an item key", () => {
    expect(parseLibraryItemKey("root")).toBeNull();
    expect(parseLibraryItemKey("card:3")).toBeNull();
    expect(parseLibraryItemKey("folder:")).toBeNull();
    expect(parseLibraryItemKey("folder:abc")).toBeNull();
  });
});

describe("canMoveLibraryItem", () => {
  describe("self-drop", () => {
    it("rejects dropping a folder onto itself", () => {
      const folder = makeItem({ id: 3, type: "folder", depth: 1, parent_id: 1 });
      expect(
        canMoveLibraryItem(folder, folderTarget(3, 1), MAX_FOLDER_DEPTH),
      ).toBe(false);
    });

    it("allows a deck onto a folder that happens to share its id", () => {
      const deck = makeItem({ id: 3, type: "deck", parent_id: null });
      expect(
        canMoveLibraryItem(deck, folderTarget(3, 0), MAX_FOLDER_DEPTH),
      ).toBe(true);
    });
  });

  describe("drop onto current parent", () => {
    it("rejects a move into the folder the item is already in", () => {
      const deck = makeItem({ id: 9, type: "deck", parent_id: 4 });
      expect(
        canMoveLibraryItem(deck, folderTarget(4, 0), MAX_FOLDER_DEPTH),
      ).toBe(false);
    });

    it("allows a move into a different sibling folder", () => {
      const deck = makeItem({ id: 9, type: "deck", parent_id: 4 });
      expect(
        canMoveLibraryItem(deck, folderTarget(5, 0), MAX_FOLDER_DEPTH),
      ).toBe(true);
    });
  });

  describe("drop to root", () => {
    it("allows an item inside a folder to move to root", () => {
      const deck = makeItem({ type: "deck", parent_id: 4 });
      expect(canMoveLibraryItem(deck, { kind: "root" }, MAX_FOLDER_DEPTH)).toBe(true);
    });

    it("rejects an item that is already at root", () => {
      const deck = makeItem({ type: "deck", parent_id: null });
      expect(canMoveLibraryItem(deck, { kind: "root" }, MAX_FOLDER_DEPTH)).toBe(false);
    });
  });

  describe("max-depth target", () => {
    it("rejects a folder into a folder already at max depth", () => {
      const folder = makeItem({ id: 10, type: "folder", depth: 0, parent_id: null });
      expect(
        canMoveLibraryItem(folder, folderTarget(20, MAX_FOLDER_DEPTH), MAX_FOLDER_DEPTH),
      ).toBe(false);
    });

    it("allows a folder into a folder one level below max", () => {
      const folder = makeItem({ id: 10, type: "folder", depth: 0, parent_id: null });
      expect(
        canMoveLibraryItem(folder, folderTarget(20, MAX_FOLDER_DEPTH - 1), MAX_FOLDER_DEPTH),
      ).toBe(true);
    });

    it("still allows a deck into a max-depth folder (decks don't count toward depth)", () => {
      const deck = makeItem({ id: 11, type: "deck", parent_id: null });
      expect(
        canMoveLibraryItem(deck, folderTarget(20, MAX_FOLDER_DEPTH), MAX_FOLDER_DEPTH),
      ).toBe(true);
    });
  });
});