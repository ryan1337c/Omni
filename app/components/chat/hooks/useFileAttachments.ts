"use client";

import { useEffect, useRef, useState } from "react";

import type { FileWithPreview } from "../types";

export function useFileAttachments() {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files![0];
      const fileWithUrl = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setFiles((prevFiles) => [...prevFiles, fileWithUrl]);
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

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();

          const fileWithUrl = Object.assign(file, {
            preview: URL.createObjectURL(file),
          });

          setFiles((prevFiles) => [...prevFiles, fileWithUrl]);
        }
      }
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
