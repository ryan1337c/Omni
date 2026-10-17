import { AuthServices } from "@/lib/authServices";
import type { JdKeyword, KeywordScoring, ResumeContent } from "@/lib/resume/schema";

import type { ResumeRequestInput } from "./types";

const authServices = new AuthServices();

export async function generateResumeRequest({
  file,
  jobTitle,
  jobDescription,
}: ResumeRequestInput) {
  const formData = new FormData();
  formData.append("resumeFile", file);
  formData.append("jobDescription", jobDescription);
  formData.append("jobTitle", jobTitle);

  const session = await authServices.getSession();
  const result = await fetch("/api/generateResume", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const data = await result.json();
  return { result, data };
}

/**
 * What `useKeywordScoring` depends on. The hook never talks to Jev itself (DIP):
 * any function with this shape — the real request, or a stand-in — can supply a pass.
 */
export type ScoreResume = (
  resume: ResumeContent,
  keywords: JdKeyword[],
) => Promise<KeywordScoring>;

function readErrorMessage(data: unknown): string | null {
  if (data === null || typeof data !== "object" || !("error" in data)) return null;
  const error = (data as { error?: unknown }).error;
  return typeof error === "string" && error ? error : null;
}

/**
 * Accept only a pass that lines up with the keywords we sent.
 * A short or non-numeric `levels` array would crash the score aggregator.
 */
function parseKeywordScoring(data: unknown, keywordCount: number): KeywordScoring {
  if (data === null || typeof data !== "object") {
    throw new Error("Something went wrong");
  }

  const record = data as { levels?: unknown; scoredBy?: unknown };
  const { levels, scoredBy } = record;
  if (scoredBy !== "jev" && scoredBy !== "keyword") {
    throw new Error("Something went wrong");
  }
  if (
    !Array.isArray(levels) ||
    levels.length !== keywordCount ||
    !levels.every((level): level is number => typeof level === "number" && Number.isFinite(level))
  ) {
    throw new Error("Something went wrong");
  }

  return { levels, scoredBy };
}

/**
 * Re-score an edited resume against the keywords from tailoring.
 * Returns `KeywordScoring` only (ISP): the caller already has the resume and keywords.
 * Status codes and the JSON body stay here (SRP); the hook only stores the result.
 * Charges no credits.
 */
export async function scoreResumeRequest(
  resume: ResumeContent,
  keywords: JdKeyword[],
): Promise<KeywordScoring> {
  const session = await authServices.getSession();
  const result = await fetch("/api/scoreResume", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume, keywords }),
  });

  const data: unknown = await result.json().catch(() => null);
  if (!result.ok) {
    throw new Error(readErrorMessage(data) ?? "Something went wrong");
  }

  return parseKeywordScoring(data, keywords.length);
}

/**
 * Compile the edited resume to a PDF. Returns the raw response: a PDF body on success,
 * or a JSON `{ error }` body otherwise. Charges no credits.
 */
export async function renderResumeRequest(resume: ResumeContent) {
  const session = await authServices.getSession();
  return fetch("/api/renderResume", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume }),
  });
}
