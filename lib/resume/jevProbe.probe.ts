import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { scoreKeywords } from "./jevScore";
import { countingPlacements, scoreKeywordEvidence } from "./keywordMatch";
import { parseKeywords, parseResumeContent } from "./parseResumeJson";
import type { PlacementSource } from "./schema";

/**
 * Sends every fixture to the real Jev API (one request per Experience, Projects, and Education Entry
 * that has questions, plus the whole-resume request) and prints each Keyword's Depth Level (Hard, Soft) or Match Probability
 * (Other), credit, whether it is Implied, and where it counts, plus request count and wall time.
 * Run with `npm run jev:probe`; needs TYPESAFE_API_KEY in the environment or `.env.local`.
 * Not part of `npm test`: it costs API calls and its output is for a human to judge.
 */
if (!process.env.TYPESAFE_API_KEY && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const FIXTURES_DIR = join(__dirname, "fixtures");
const fixtures = readdirSync(FIXTURES_DIR).filter((file) => file.endsWith(".json"));

function sourceLabel(source: PlacementSource): string {
  return "entry" in source ? `${source.section}[${source.entry}]` : source.section;
}

describe.skipIf(!process.env.TYPESAFE_API_KEY)("Jev probe", () => {
  it.each(fixtures)("%s", async (file) => {
    const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, file), "utf8"));
    const keywords = parseKeywords(raw.keywords);
    const resume = parseResumeContent(raw.resume);
    let requests = 0;
    const countingFetch: typeof fetch = (input, init) => {
      requests += 1;
      return fetch(input, init);
    };

    const started = performance.now();
    const scoring = await scoreKeywords(keywords, resume, { fetch: countingFetch });
    const seconds = (performance.now() - started) / 1000;
    const score = scoreKeywordEvidence(keywords, scoring.evidence, resume);

    console.log(
      `\n${file}: score ${score.score} (${score.label}), ${requests} requests in ${seconds.toFixed(2)} s`,
    );
    console.table(
      score.results.map(({ keyword, level, weight, evidence }) => ({
        keyword: keyword.term,
        category: keyword.category,
        depthLevelOrMatchProbability: Number(level.toFixed(2)),
        credit: Number(weight.toFixed(2)),
        implied: evidence.kind === "skill" && weight > 0 && !evidence.explicit,
        countsIn:
          evidence.kind === "skill"
            ? countingPlacements(evidence)
                .map((p) => `${sourceLabel(p.source)}@${p.depthLevel.toFixed(1)}`)
                .join(" ")
            : "",
      })),
    );
    expect(scoring.scoredBy).toBe("jev");
  }, 60_000);
});
