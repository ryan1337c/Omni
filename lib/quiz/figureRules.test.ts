import { describe, expect, it } from "vitest";

import { checkFigureFiles } from "./figureRules";

const MB = 1024 * 1024;
const png = { name: "graph.png", type: "image/png", size: MB };

describe("checkFigureFiles", () => {
  it.each([
    ["PNG", "image/png"],
    ["JPEG", "image/jpeg"],
    ["WebP", "image/webp"],
  ])("accepts a %s picture", (_, type) => {
    expect(checkFigureFiles([{ ...png, type }], 0)).toBeUndefined();
  });

  it.each([
    ["a GIF", "image/gif"],
    ["an SVG", "image/svg+xml"],
    ["a PDF", "application/pdf"],
  ])("rejects %s", (_, type) => {
    expect(checkFigureFiles([{ ...png, type }], 0)).toContain("PNG, JPEG, or WebP");
  });

  it("accepts a picture of exactly 4 MB and rejects a bigger one", () => {
    expect(checkFigureFiles([{ ...png, size: 4 * MB }], 0)).toBeUndefined();
    expect(checkFigureFiles([{ ...png, size: 4 * MB + 1 }], 0)).toContain("4 MB");
  });

  it("allows up to 4 Figures on a question, counting the ones it has", () => {
    expect(checkFigureFiles([png, png], 2)).toBeUndefined();
    expect(checkFigureFiles([png], 4)).toContain("4 Figures");
    expect(checkFigureFiles([png, png, png, png, png], 0)).toContain("4 Figures");
  });
});
