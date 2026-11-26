"use client";

import { useEffect, useRef, useState } from "react";

import { checkChatAttachment } from "@/lib/inputLimits";

import type { FileWithPreview } from "../types";

function withPreview(file: File): FileWithPreview {
  return Object.assign(file, {
    preview: URL.createObjectURL(file),
  });
}

export function useFileAttachments(onError?: (message: string) => void) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadSelect = () => {
    fileInputRef.current?.click();
  };

  const addFiles = (incoming: File[]) => {
    let error: string | undefined;

    setFiles((prevFiles) => {
      const nextFiles = [...prevFiles];

      for (const file of incoming) {
        const reason = checkChatAttachment(file, nextFiles);
        if (reason) {
          if (!error) error = reason;
          continue;
        }
        nextFiles.push(withPreview(file));
      }

      return nextFiles;
    });

    if (error) {
      onError?.(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileDelete = (fileIndex: number) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles[fileIndex];
      URL.revokeObjectURL(fileToRemove.preview);
      return prevFiles.filter((_, index) => index !== fileIndex);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const pasted: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          pasted.push(file);
        }
      }
    }

    if (pasted.length > 0) {
      e.preventDefault();
      addFiles(pasted);
    }
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return {
    files,
    setFiles,
    fileInputRef,
    clearFiles,
    handleUploadSelect,
    handleFileChange,
    handleFileDelete,
    handlePaste,
  };
}
