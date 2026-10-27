import { describe, expect, it } from "vitest";

import { parseKeywords, parseResumeContent } from "./parseResumeJson";

const header = { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" };

describe("parseResumeContent", () => {
  it("uses the default section order when the payload has none", () => {
    const resume = parseResumeContent({ header });

    expect(resume.sectionOrder).toEqual([
      "summary",
      "education",
      "experience",
      "projects",
      "skills",
      "honors",
    ]);
  });

  it("keeps a saved order, dropping unknown and repeated ids and appending missing ones", () => {
    const resume = parseResumeContent({
      header,
      sectionOrder: ["honors", "awards", "skills", "honors", 7],
    });

    expect(resume.sectionOrder).toEqual([
      "honors",
      "skills",
      "summary",
      "education",
      "experience",
      "projects",
    ]);
  });

  it("treats a missing summary and honors as empty", () => {
    const resume = parseResumeContent({ header });

    expect(resume.summary).toBe("");
    expect(resume.honors).toEqual([]);
  });

  it("fills missing honor fields with empty strings", () => {
    const resume = parseResumeContent({
      header,
      honors: [{ title: "Dean's List", issuer: "Southwestern University" }],
    });

    expect(resume.honors).toEqual([
      { title: "Dean's List", issuer: "Southwestern University", date: "", description: "" },
    ]);
  });
});

describe("parseKeywords", () => {
  const hard = (term: string, rest: Record<string, unknown> = {}) => ({
    term,
    aliases: [],
    category: "hard",
    importance: "required",
    ...rest,
  });

  it("treats a keyword saved before Alternatives and Clauses as standalone with no Clause", () => {
    expect(parseKeywords([hard("Python")])).toEqual([
      { term: "Python", aliases: [], category: "hard", importance: "required", alternatives: "", clause: "" },
    ]);
  });

  it("keeps an Other Keyword's Clause and clears one on a Hard Skill", () => {
    const [years, python] = parseKeywords([
      {
        term: "3+ years professional experience",
        aliases: [],
        category: "other",
        importance: "required",
        clause: "+3 years of professional software development experience, including internships or co-op placements.",
      },
      hard("Python", { clause: "Experience with Python and Go." }),
    ]);

    expect(years.clause).toBe(
      "+3 years of professional software development experience, including internships or co-op placements.",
    );
    expect(python.clause).toBe("");
  });

  it("gives every option in a set of Alternatives the most important option's Importance", () => {
    const keywords = parseKeywords([
      hard("Expo", { alternatives: "mobile", importance: "preferred" }),
      hard("React Native", { alternatives: "mobile" }),
    ]);

    expect(keywords.map(({ alternatives, importance }) => [alternatives, importance])).toEqual([
      ["mobile", "required"],
      ["mobile", "required"],
    ]);
  });

  it("treats a one-option set, and Alternatives on an Other Keyword, as standalone", () => {
    const keywords = parseKeywords([
      hard("Expo", { alternatives: "mobile" }),
      { term: "BS in Computer Science", aliases: [], category: "other", importance: "required", alternatives: "degree" },
      { term: "MS in Computer Science", aliases: [], category: "other", importance: "required", alternatives: "degree" },
    ]);

    expect(keywords.map(({ alternatives }) => alternatives)).toEqual(["", "", ""]);
  });
});
