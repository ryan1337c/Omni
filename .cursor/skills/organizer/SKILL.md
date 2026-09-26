---
name: organizer
description: Reorganize and refactor .tsx files under app/ into small, focused modules. Enforces a 500-line limit per file, SOLID, and DRY while preserving behavior and routes. Use when the user asks to organize, restructure, refactor, clean up, or split a file, or says a file is too long.
disable-model-invocation: true
---

# Organizer

Refactor `app/**/*.tsx` into small, single-purpose files without changing behavior.

Stack: Next 14 App Router. `@/*` resolves to the repo root.

## Hard rules

- No file in `app/` may exceed **500 lines**. Target ~300 to leave headroom.
- Behavior is preserved: same UI, same props contract for external callers, same routes.
- Never move or rename `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, or route folders. These files may only get thinner.
- Keep `"use client"` on any file using hooks, event handlers, or browser APIs. Add it to each extracted file that needs it; do not add it to pure utils, types, or constants.
- Use `@/` imports. No deep relative paths like `../../..`. Sibling imports (`./`) inside a feature folder are fine.

## Target structure

Group each large component into a feature folder:

```
app/components/<feature>/
  <Feature>.tsx        // composition only
  components/          // presentational subcomponents
  hooks/use<Thing>.ts  // state, effects, data fetching
  utils.ts             // pure functions
  types.ts             // feature types
  constants.ts
  index.ts             // public export
```

- `index.ts` re-exports the public component so existing imports can be updated to `@/app/components/<feature>`.
- Shared across features:
  - Hooks go in `app/hooks`
  - React context goes in `app/context`
  - Pure logic goes in `lib/`
  - Types go in `components/types`
  - Generic UI primitives go in `components/ui` (shadcn). Reuse what's there (buttons, selects, dropdown menus) instead of re-creating them.
- Promote code to a shared location only once a second feature needs it.

## SOLID for React

- **SRP**: a component either renders or orchestrates. Logic goes in hooks; calculations go in pure utils.
- **OCP**: extend with props, variants, or a config map instead of growing `switch`/`if` chains.
- **LSP**: wrapper components accept and forward the base element's props (`...props`, `ComponentProps<"button">`).
- **ISP**: keep props small and specific. Pass only the fields a child uses, not whole objects.
- **DIP**: `fetch`, Supabase, and other clients sit behind hooks or `lib/` functions. Components never call `fetch` directly.

## DRY

- Before writing anything new, search `components/ui`, `app/hooks`, `app/helper`, and `lib/` for an existing version.
- Extract code duplicated in two or more places. Likely candidates: `QuizGenerationModal` and `FlashcardGenerationModal` (shared modal shell, form state hooks).
- Do not abstract code that appears only once.

## Workflow

1. List `app/**/*.tsx` with line counts and handle the largest first:

   ```powershell
   Get-ChildItem app -Recurse -Filter *.tsx | ForEach-Object { [pscustomobject]@{ Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines; Path = $_.FullName } } | Sort-Object Lines -Descending
   ```

2. Work on one file (one feature) per pass:
   - Read the whole file and list its responsibilities (state, effects, API calls, handlers, render sections).
   - Extract in this order: types and constants, then pure utils, then hooks, then subcomponents.
   - Leave the original file as a thin composition layer (or `index.ts` plus `<Feature>.tsx`).
   - Update every importer (search for the old path).
3. Verify after each pass:
   - `npm run lint`
   - `npx tsc --noEmit`
   - Every touched file is at or under 500 lines.
4. Delete empty or dead files (e.g. `app/components/recents.tsx`) only after confirming nothing imports them.

## Output style

- Keep diffs minimal. Move code as-is; don't rewrite logic you're only relocating.
- No commentary comments in the code.
- End each pass with a short summary listing:
  - New, moved, and deleted files
  - Old vs. new line counts for the file that was split

## Done checklist

- [ ] Every `app/**/*.tsx` file is at or under 500 lines
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No routes changed (`page.tsx`/`layout.tsx` paths untouched)
- [ ] No duplicated blocks introduced; shared UI reuses `components/ui`
