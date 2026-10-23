import type { EntrySource, PlacementEntrySection, ResumeContent } from "./schema";

type EntryOf<S extends PlacementEntrySection> = ResumeContent[S][number];

type FieldsOf<S extends PlacementEntrySection> = {
  /** The one field that names the Entry, such as a job title. */
  name: keyof EntryOf<S> & string;
  /** What the user and Jev read as the Entry's name, e.g. "Staff Engineer, Acme". */
  label: readonly (keyof EntryOf<S> & string)[];
  /** What tells the Entry apart from the others in its section after Entries are added, removed, or reordered. */
  identity: readonly (keyof EntryOf<S> & string)[];
  /** All Jev sees in the Entry's own request, so it can't credit the Entry for another Entry's content. */
  state: readonly (keyof EntryOf<S> & string)[];
};

/** Which fields of each Entry section each reader uses. */
export const ENTRY_FIELDS: { [S in PlacementEntrySection]: FieldsOf<S> } = {
  experience: {
    name: "title",
    label: ["title", "company"],
    identity: ["title", "company", "dates"],
    state: ["title", "company", "dates", "bullets"],
  },
  projects: {
    name: "name",
    label: ["name"],
    identity: ["name", "dates"],
    state: ["name", "technologies", "dates", "bullets"],
  },
  education: {
    name: "institution",
    label: ["degree", "institution"],
    identity: ["institution", "degree", "dates"],
    state: ["institution", "degree", "dates", "bullets"],
  },
};

function pick(
  resume: ResumeContent,
  { section, entry }: EntrySource,
  use: "label" | "identity" | "state",
): [string, unknown][] | undefined {
  const fields = resume[section][entry] as Record<string, unknown> | undefined;
  const names: readonly string[] = ENTRY_FIELDS[section][use];
  return fields && names.map((name) => [name, fields[name]]);
}

/** "Staff Engineer, Acme" for a job, the name for a project, "BS, York University" for Education; "" if missing. */
export function entryLabel(resume: ResumeContent, source: EntrySource): string {
  return (pick(resume, source, "label") ?? [])
    .map(([, value]) => value)
    .filter(Boolean)
    .join(", ");
}

/** Equal for the same Entry in two versions of a resume; undefined if the Entry is missing. */
export function entryIdentity(resume: ResumeContent, source: EntrySource): string | undefined {
  const fields = pick(resume, source, "identity");
  return fields && JSON.stringify(fields.map(([, value]) => value));
}

export function entryState(resume: ResumeContent, source: EntrySource): Record<string, unknown> {
  return Object.fromEntries(pick(resume, source, "state") ?? []);
}
