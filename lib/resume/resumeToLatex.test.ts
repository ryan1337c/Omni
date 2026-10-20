import { describe, expect, it } from "vitest";

import { parseResumeContent } from "./parseResumeJson";
import { resumeToLatexBody } from "./resumeToLatex";

const header = { name: "Jake Ryan", phone: "", email: "", linkedin: "", github: "" };
const education = [
  { institution: "Southwestern University", location: "", degree: "BA CS", dates: "2021", bullets: [] },
];

function sectionTitles(body: string): string[] {
  return Array.from(body.matchAll(/\\section\{([^}]*)\}/g), (match) => match[1]);
}

describe("resumeToLatexBody", () => {
  it("renders sections in the saved order and skips empty ones", () => {
    const resume = parseResumeContent({
      header,
      summary: "Engineer.",
      education,
      skills: [{ category: "Languages", items: "Java" }],
      sectionOrder: ["skills", "honors", "education", "summary"],
    });

    expect(sectionTitles(resumeToLatexBody(resume))).toEqual([
      "Technical Skills",
      "Education",
      "Professional Summary",
    ]);
  });

  it("puts the summary first and honors last by default", () => {
    const resume = parseResumeContent({
      header,
      summary: "Engineer.",
      education,
      honors: [{ title: "Dean's List", issuer: "", date: "", description: "" }],
    });

    expect(sectionTitles(resumeToLatexBody(resume))).toEqual([
      "Professional Summary",
      "Education",
      "Licenses, Certifications, and Awards",
    ]);
  });

  it("renders the summary as an escaped paragraph", () => {
    const resume = parseResumeContent({ header, summary: "Builds APIs & data pipelines." });

    expect(resumeToLatexBody(resume)).toContain("\\small{\\item{Builds APIs \\& data pipelines.}}");
  });

  it("renders each honor as one bullet, adding the description only when present", () => {
    const resume = parseResumeContent({
      header,
      honors: [
        { title: "ICPC Regional Finalist", issuer: "ICPC Foundation", date: "2020", description: "Top 10 of 120 teams" },
        { title: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2025", description: "" },
        { title: "", issuer: "", date: "", description: "" },
      ],
    });
    const body = resumeToLatexBody(resume);

    expect(body).toContain(
      "\\resumeItem{\\textbf{ICPC Regional Finalist}, ICPC Foundation, 2020 --- Top 10 of 120 teams}",
    );
    expect(body).toContain("\\resumeItem{\\textbf{AWS Solutions Architect}, Amazon Web Services, 2025}");
    expect(body.match(/\\resumeItem\{/g)).toHaveLength(2);
  });
});
