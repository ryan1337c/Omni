"use client";

import { useState, ChangeEvent, DragEvent } from 'react';
import { FiUploadCloud, FiFileText, FiX } from 'react-icons/fi';

import type { ResumeRequestInput } from '../types';

type ResumeUploadFormProps = {
  isProcessing: boolean;
  onSubmit: (input: ResumeRequestInput) => void;
  onError: (message: string) => void;
};

export default function ResumeUploadForm({ isProcessing, onSubmit, onError }: ResumeUploadFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (file: File) => {
    if (file.type === "application/pdf") {
      setUploadedFile(file);
    } else {
      onError("Please upload a valid PDF file.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      acceptFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      acceptFile(event.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadedFile) {
      onError("Please upload a resume file first.");
      return;
    }
    onSubmit({ file: uploadedFile, jobTitle, jobDescription });
  };

  if (!uploadedFile) {
    return (
      // --- INITIAL UPLOAD PROMPT (Theme-Aware) ---
      <label
        htmlFor="resume-upload"
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
          ${isDragging 
            ? 'border-violet-500 bg-violet-50 dark:border-slate-400 dark:bg-slate-700' 
            : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FiUploadCloud className={`w-10 h-10 mb-3 transition-colors ${isDragging ? 'text-violet-600 dark:text-slate-400' : 'text-slate-400 dark:text-gray-500'}`} />
          <p className="mb-2 text-sm text-slate-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-slate-500 dark:text-gray-500">PDF only (MAX. 5MB)</p>
        </div>
        <input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
      </label>
    );
  }

  return (
    // --- FILE UPLOADED, SHOW FORM (Theme-Aware) ---
    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in-up-sm">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
          <div className="flex items-center gap-3 min-w-0"><FiFileText className="text-violet-500 dark:text-[#818CF8] w-6 h-6 flex-shrink-0" /><span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{uploadedFile.name}</span></div>
          <button onClick={handleRemoveFile} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors" aria-label="Remove file"><FiX className="w-5 h-5" /></button>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div><label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Job Title</label><input type="text" autoComplete="off" id="jobTitle" value={jobTitle} required onChange={(e) => setJobTitle(e.target.value)} disabled={isProcessing} className="block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:focus:ring-btnDark/95 sm:text-sm" placeholder="e.g., Senior Software Engineer"/></div>
        <div><label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Job Description</label><textarea id="jobDescription" rows={6} value={jobDescription} required onChange={(e) => setJobDescription(e.target.value)} disabled={isProcessing} className="block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:focus:ring-btnDark/95 sm:text-sm" placeholder="Paste the full job description here..."/></div>
        <button type="submit" disabled={isProcessing} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 dark:focus:ring-purple-500 transition-colors">{isProcessing ? "Processing..." : "Generate"}</button>
      </form>
    </div>
  );
}
