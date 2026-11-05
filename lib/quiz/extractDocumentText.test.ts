import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { extractDocumentText } from "./extractDocumentText";

const PDF = "application/pdf";

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
}

/** pdf.js injects fonts after reading returns, so wait for those delayed rejections. */
async function expectNoDocumentRejection(run: () => Promise<void>) {
  const rejections: unknown[] = [];
  const onReject = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on("unhandledRejection", onReject);
  try {
    await run();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(
      rejections.filter(
        (reason) => reason instanceof Error && reason.message.includes("document is not defined"),
      ),
    ).toEqual([]);
  } finally {
    process.off("unhandledRejection", onReject);
  }
}

describe("extractDocumentText from a PDF", () => {
  it("reads a PDF that embeds its own fonts without a document-missing rejection", async () => {
    await expectNoDocumentRejection(async () => {
      const text = await extractDocumentText({
        bytes: fixture("embedded-font.pdf"),
        mimeType: PDF,
      });
      expect(text).toContain("Photosynthesis happens in chloroplasts.");
    });
  });
});
