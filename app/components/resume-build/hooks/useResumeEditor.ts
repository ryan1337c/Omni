"use client";

import { useMemo, useReducer, type Dispatch } from "react";

import { MAX_BULLETS_PER_ENTRY, MAX_SECTION_ENTRIES } from "@/lib/resume/parseResumeJson";
import type {
  EducationEntry,
  ExperienceEntry,
  HonorEntry,
  ProjectEntry,
  ResumeContent,
  ResumeHeader,
  SectionId,
  SkillEntry,
} from "@/lib/resume/schema";

type SectionEntries = {
  education: EducationEntry;
  experience: ExperienceEntry;
  projects: ProjectEntry;
  skills: SkillEntry;
  honors: HonorEntry;
};

export type EntrySection = keyof SectionEntries;
export type BulletSection = "education" | "experience" | "projects";

/** Keys of `T` that hold a single string (i.e. everything except `bullets`). */
type TextField<T> = { [K in keyof T]-?: T[K] extends string ? K : never }[keyof T];

export type FieldPath =
  | { section: "header"; field: keyof ResumeHeader }
  | { section: "summary" }
  | { [S in EntrySection]: { section: S; index: number; field: TextField<SectionEntries[S]> } }[EntrySection]
  | { section: BulletSection; index: number; bulletIndex: number };

type ResumeEditorAction =
  | { type: "updateField"; path: FieldPath; value: string }
  | { type: "addBullet"; section: BulletSection; index: number; afterBullet?: number }
  | { type: "removeBullet"; section: BulletSection; index: number; bulletIndex: number }
  | { type: "addEntry"; section: EntrySection }
  | { type: "removeEntry"; section: EntrySection; index: number }
  | { type: "moveSection"; section: SectionId; target: SectionId };

const EMPTY_ENTRY: { [S in EntrySection]: () => SectionEntries[S] } = {
  education: () => ({ institution: "", location: "", degree: "", dates: "", bullets: [] }),
  experience: () => ({ title: "", company: "", location: "", dates: "", bullets: [""] }),
  projects: () => ({ name: "", technologies: "", dates: "", bullets: [""] }),
  skills: () => ({ category: "", items: "" }),
  honors: () => ({ title: "", issuer: "", date: "", description: "" }),
};

function updateEntry<S extends EntrySection>(
  state: ResumeContent,
  section: S,
  index: number,
  update: (entry: SectionEntries[S]) => SectionEntries[S],
): ResumeContent {
  const entries = state[section] as SectionEntries[S][];
  return { ...state, [section]: entries.map((entry, i) => (i === index ? update(entry) : entry)) };
}

export function resumeEditorReducer(state: ResumeContent, action: ResumeEditorAction): ResumeContent {
  switch (action.type) {
    case "updateField": {
      const { path, value } = action;
      if (path.section === "header") {
        return { ...state, header: { ...state.header, [path.field]: value } };
      }
      if (path.section === "summary") {
        return { ...state, summary: value };
      }
      if ("bulletIndex" in path) {
        return updateEntry(state, path.section, path.index, (entry) => ({
          ...entry,
          bullets: entry.bullets.map((bullet, i) => (i === path.bulletIndex ? value : bullet)),
        }));
      }
      return updateEntry(state, path.section, path.index, (entry) => ({ ...entry, [path.field]: value }));
    }

    case "addBullet":
      return updateEntry(state, action.section, action.index, (entry) => {
        if (entry.bullets.length >= MAX_BULLETS_PER_ENTRY) return entry;
        const insertAt = (action.afterBullet ?? entry.bullets.length - 1) + 1;
        const bullets = [...entry.bullets];
        bullets.splice(insertAt, 0, "");
        return { ...entry, bullets };
      });

    case "removeBullet":
      return updateEntry(state, action.section, action.index, (entry) => ({
        ...entry,
        bullets: entry.bullets.filter((_, i) => i !== action.bulletIndex),
      }));

    case "addEntry": {
      const entries = state[action.section];
      if (entries.length >= MAX_SECTION_ENTRIES) return state;
      return { ...state, [action.section]: [...entries, EMPTY_ENTRY[action.section]()] };
    }

    case "removeEntry":
      return {
        ...state,
        [action.section]: state[action.section].filter((_, i) => i !== action.index),
      };

    case "moveSection": {
      const from = state.sectionOrder.indexOf(action.section);
      const to = state.sectionOrder.indexOf(action.target);
      if (from === -1 || to === -1 || from === to) return state;
      const sectionOrder = [...state.sectionOrder];
      sectionOrder.splice(from, 1);
      sectionOrder.splice(to, 0, action.section);
      return { ...state, sectionOrder };
    }
  }
}

function createActions(dispatch: Dispatch<ResumeEditorAction>) {
  return {
    updateField: (path: FieldPath, value: string) => dispatch({ type: "updateField", path, value }),
    /** Inserts an empty bullet after `afterBullet`, or at the end when omitted. */
    addBullet: (section: BulletSection, index: number, afterBullet?: number) =>
      dispatch({ type: "addBullet", section, index, afterBullet }),
    removeBullet: (section: BulletSection, index: number, bulletIndex: number) =>
      dispatch({ type: "removeBullet", section, index, bulletIndex }),
    addEntry: (section: EntrySection) => dispatch({ type: "addEntry", section }),
    removeEntry: (section: EntrySection, index: number) => dispatch({ type: "removeEntry", section, index }),
    /** Moves `section` into `target`'s slot: before it when moving up, after it when moving down. */
    moveSection: (section: SectionId, target: SectionId) => dispatch({ type: "moveSection", section, target }),
  };
}

export type ResumeEditorActions = ReturnType<typeof createActions>;

/** Local, session-only edit state for the tailored resume. */
export function useResumeEditor(initialResume: ResumeContent) {
  const [resume, dispatch] = useReducer(resumeEditorReducer, initialResume);
  // `dispatch` never changes, so `actions` is stable for the life of the editor.
  const actions = useMemo(() => createActions(dispatch), []);

  return { resume, actions };
}
