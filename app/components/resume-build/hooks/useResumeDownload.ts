"use client";

import { useState } from "react";

import type { ResumeContent } from "@/lib/resume/schema";

import { renderResumeRequest } from "../api";
import { RESUME_DOWNLOAD_FILENAME } from "../constants";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Compiles the edited resume on the server and saves the PDF.
 * Failures (including LaTeX compile errors) are passed to `onError` for the shared error toast.
 */
export function useResumeDownload(onError: (message: string) => void) {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async (resume: ResumeContent) => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await renderResumeRequest(resume);
      if (!response.ok) {
        // Error responses are JSON; fall back to a generic message if the body isn't.
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      saveBlob(await response.blob(), RESUME_DOWNLOAD_FILENAME);
    } catch (error) {
      console.error("Resume download failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      onError(`Couldn't create your PDF: ${message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}
