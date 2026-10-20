import { describe, expect, it } from "vitest";

import { parseResumeContent } from "@/lib/resume/parseResumeJson";

import { resumeEditorReducer } from "./useResumeEditor";

const resume = parseResumeContent({
  header: { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" },
});

describe("moveSection", () => {
  it("moving up places the section before the target", () => {
    const next = resumeEditorReducer(resume, { type: "moveSection", section: "skills", target: "education" });

    expect(next.sectionOrder).toEqual(["summary", "skills", "education", "experience", "projects", "honors"]);
  });

  it("moving down places the section after the target, past any sections in between", () => {
    const next = resumeEditorReducer(resume, { type: "moveSection", section: "summary", target: "projects" });

    expect(next.sectionOrder).toEqual(["education", "experience", "projects", "summary", "skills", "honors"]);
  });

  it("leaves the resume unchanged when a section is moved onto itself", () => {
    const next = resumeEditorReducer(resume, { type: "moveSection", section: "projects", target: "projects" });

    expect(next).toBe(resume);
  });
});

describe("updateField", () => {
  it("edits the summary", () => {
    const next = resumeEditorReducer(resume, {
      type: "updateField",
      path: { section: "summary" },
      value: "Engineer.",
    });

    expect(next.summary).toBe("Engineer.");
  });
});
