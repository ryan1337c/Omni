import { highlightedKeywords, isSemanticKeyword, type KeywordMatchResult } from "./keywordMatch";
import type { BulletRef, JdKeyword, PlacementEntrySection, PlacementSource, ResumeContent } from "./schema";

/** What to mark on the resume on screen, which may have changed since it was scored. */
export type ResumeHighlights = {
  /** Keywords to highlight in one live Placement's text, or outside every Placement when null. */
  keywordsIn(source: PlacementSource | null): JdKeyword[];
  /** Whether a live Bullet is the one Jev judged a specific example of a Soft Skill. */
  isDemonstratingBullet(bullet: BulletRef): boolean;
};

type EntrySource = { section: PlacementEntrySection; entry: number };

function entryIdentity(resume: ResumeContent, { section, entry }: EntrySource): string | undefined {
  switch (section) {
    case "experience": {
      const job = resume.experience[entry];
      return job && JSON.stringify([job.title, job.company, job.dates]);
    }
    case "projects": {
      const project = resume.projects[entry];
      return project && JSON.stringify([project.name, project.dates]);
    }
    case "education": {
      const school = resume.education[entry];
      return school && JSON.stringify([school.institution, school.degree, school.dates]);
    }
  }
}

/**
 * The scored Entry a live Entry is, matched by its title, company, and dates (name and dates for a
 * project; institution, degree, and dates for Education) so added, removed, or reordered Entries keep
 * their own evidence. Null when the live Entry was not scored, was renamed, or can't be told apart.
 */
function scoredEntryOf(live: EntrySource, scored: ResumeContent, liveResume: ResumeContent): EntrySource | null {
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
    keywordsIn(source) {
      if (!source || !("entry" in source)) return highlightedKeywords(results, source);
      const scoredEntry = scoredEntryOf(source, scored, live);
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
