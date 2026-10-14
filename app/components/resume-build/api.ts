import { AuthServices } from "@/lib/authServices";
import type { ResumeContent } from "@/lib/resume/schema";

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
