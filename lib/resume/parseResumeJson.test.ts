import { describe, expect, it } from "vitest";

import { parseResumeContent } from "./parseResumeJson";

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
