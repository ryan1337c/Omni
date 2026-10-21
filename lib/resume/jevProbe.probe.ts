import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { scoreKeywords } from "./jevScore";
import { scoreKeywordLevels } from "./keywordMatch";
import { parseKeywords, parseResumeContent } from "./parseResumeJson";

/**
 * Sends every fixture to the real Jev API and prints each Keyword's Depth Level and credit.
 * Run with `npm run jev:probe`; needs TYPESAFE_API_KEY in the environment or `.env.local`.
 * Not part of `npm test`: it costs API calls and its output is for a human to judge.
 */
if (!process.env.TYPESAFE_API_KEY && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const FIXTURES_DIR = join(__dirname, "fixtures");
const fixtures = readdirSync(FIXTURES_DIR).filter((file) => file.endsWith(".json"));

describe.skipIf(!process.env.TYPESAFE_API_KEY)("Jev probe", () => {
  it.each(fixtures)("%s", async (file) => {
    const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, file), "utf8"));
    const keywords = parseKeywords(raw.keywords);
    const resume = parseResumeContent(raw.resume);

    const scoring = await scoreKeywords(keywords, resume);
    const score = scoreKeywordLevels(keywords, scoring.levels, resume);

    console.log(`\n${file}: score ${score.score} (${score.label})`);
    console.table(
      score.results.map(({ keyword, level, weight }) => ({
        keyword: keyword.term,
        depthLevel: level,
        credit: Number(weight.toFixed(2)),
      })),
    );
    expect(scoring.scoredBy).toBe("jev");
  }, 30_000);
});
