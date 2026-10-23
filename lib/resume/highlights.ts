import {
  highlightedKeywords,
  isSemanticKeyword,
  type KeywordMatchResult,
  type WorkHistoryEntryRef,
} from "./keywordMatch";
import type { BulletRef, JdKeyword, ResumeContent } from "./schema";

/** What to mark on the resume on screen, which may have changed since it was scored. */
export type ResumeHighlights = {
  /** Keywords to highlight in one live Work History Entry's text, or outside every Entry when null. */
  keywordsIn(entry: WorkHistoryEntryRef | null): JdKeyword[];
  /** Whether a live Bullet is the one Jev judged a specific example of a Soft Skill. */
  isDemonstratingBullet(bullet: BulletRef): boolean;
};

function entryIdentity(resume: ResumeContent, { section, entry }: WorkHistoryEntryRef): string | undefined {
  if (section === "experience") {
    const job = resume.experience[entry];
    return job && JSON.stringify([job.title, job.company, job.dates]);
  }
  const project = resume.projects[entry];
  return project && JSON.stringify([project.name, project.dates]);
}

/**
 * The scored Entry a live Entry is, matched by title, company, and dates (name and dates for a project)
 * so added, removed, or reordered Entries keep their own evidence. Null when the live Entry was not
 * scored, was renamed, or can't be told apart from another.
 */
function scoredEntryOf(live: WorkHistoryEntryRef, scored: ResumeContent, liveResume: ResumeContent) {
  const identity = entryIdentity(liveResume, live);
  if (identity === undefined) return null;
  if (entryIdentity(scored, live) === identity) return live;
  const matches = scored[live.section]
    .map((_, entry) => ({ section: live.section, entry }))
    .filter((candidate) => entryIdentity(scored, candidate) === identity);
  return matches.length === 1 ? matches[0] : null;
}

/**
 * `results` were scored against `scored`, so their Entry and Bullet indexes point into it; `live` is
 * the resume on screen. An Entry that can't be matched gets no skill highlights, and a Bullet whose
 * text changed is no longer the one that was judged.
 */
export function resumeHighlights(
  results: KeywordMatchResult[],
  scored: ResumeContent,
  live: ResumeContent,
): ResumeHighlights {
  return {
    keywordsIn(entry) {
      if (!entry) return highlightedKeywords(results, null);
      const scoredEntry = scoredEntryOf(entry, scored, live);
      if (!scoredEntry) return highlightedKeywords(results, null).filter(isSemanticKeyword);
      return highlightedKeywords(results, scoredEntry);
    },
    isDemonstratingBullet({ section, entry, bullet }) {
      const scoredEntry = scoredEntryOf({ section, entry }, scored, live);
      const text = live[section][entry]?.bullets[bullet];
      if (!scoredEntry || text === undefined) return false;
      const scoredBullets = scored[section][scoredEntry.entry].bullets;
      return results.some(
        ({ matched, evidence }) =>
          matched &&
          evidence.kind === "skill" &&
          evidence.demonstratingBullets.some(
            (ref) => ref.section === section && ref.entry === scoredEntry.entry && scoredBullets[ref.bullet] === text,
          ),
      );
    },
  };
}
