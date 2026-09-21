"use client";

import { useState, ChangeEvent, DragEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUploadCloud, FiFileText, FiX, FiDownload, FiLoader, FiAlertCircle} from 'react-icons/fi';
import { AuthServices } from '@/lib/authServices';
import { useAuth } from '@/app/context/AuthContext';
import {
  BILLING_SETTINGS_HREF,
  formatInsufficientCreditsMessage,
  getInsufficientCreditsInfo,
  shouldOfferCreditUpgrade,
} from '@/lib/credits/usageClient';

type ResumeBuildProps = {
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResumeBuild = ({ isProcessing, setIsProcessing }: ResumeBuildProps) => {
  const authServices = new AuthServices();
  const router = useRouter();
  const { tier } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  
  // New state to hold the URL of the generated PDF for previewing
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradeCta, setShowUpgradeCta] = useState(false);
  const [isCreditError, setIsCreditError] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        setUploadedFile(file);
      } else {
        setErrorMessage("Please upload a valid PDF file.");
      }
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
      const file = event.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setUploadedFile(file);
      } else {
        setErrorMessage("Please upload a valid PDF file.");
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  }

  const handleProceed = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!uploadedFile) {
        setErrorMessage("Please upload a resume file first.");
        return;
      }

      setErrorMessage(null);
      setShowUpgradeCta(false);
      setIsCreditError(false);
      setIsTailoring(true);
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('resumeFile', uploadedFile);
      formData.append('jobDescription', jobDescription);
      formData.append('jobTitle', jobTitle);

      let generatedUrl: string | null = null;

      try {
        const session = await authServices.getSession();
        const response = await fetch("/api/generateResume", { 
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          const creditInfo = getInsufficientCreditsInfo(response.status, errData);
          if (creditInfo) {
            setErrorMessage(formatInsufficientCreditsMessage(creditInfo, tier));
            setShowUpgradeCta(shouldOfferCreditUpgrade(tier));
            setIsCreditError(true);
            return;
          }
          throw new Error(errData.error || 'Something went wrong');
        }

        // Take the response PDF, create a URL, and set it to state for previewing.
        const blob = await response.blob();
        generatedUrl = window.URL.createObjectURL(blob);

      } catch (error: any) {
        console.error('Fetch failed: ', error.message || error);
        setErrorMessage(`An error occurred: ${error.message}`); 
      } finally {
        setIsTailoring(false);
        setIsProcessing(false);

        // Before updating the state and swapping the UI.
        if (generatedUrl) {
          setTimeout(() => {
            setPdfUrl(generatedUrl);
          }, 300); 
        }
      }
  };

  // Effect to clean up the created Object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Auto-dismiss the error popup after a few seconds
  useEffect(() => {
    if (!errorMessage || isCreditError) return;
    const timer = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage, isCreditError]);

  // A function to reset everything and start over
  const handleStartOver = () => {
    setPdfUrl(null);
    setUploadedFile(null);
    setJobTitle('');
    setJobDescription('');
  };

  // Create the special URL for the preview
  const previewUrl = pdfUrl ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=85` : '';

  return (
    // Main container now sets the base text colors for each theme.
    <div className="relative flex-1 flex flex-col min-h-0 text-slate-800 dark:text-gray-200 animate-fade-in-sm">
      {/* Processing Prompt */}
        {isTailoring && !errorMessage && (
          <div
            className="
              absolute top-[-72px] md:top-0 left-1/2 z-50
              flex items-center gap-3 px-6 py-3
              rounded-b-xl max-w-[calc(100%-2rem)]
              bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
              border-b border-slate-200 dark:border-slate-700
              animate-slide-down
            "
          >
            <FiLoader className="w-5 h-5 animate-spin text-violet-600 dark:text-violet-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tailoring your resume, please wait...
            </p>
          </div>
        )}

        {/* Error Popup — unmounts instantly on dismiss; slide-down plays on mount */}
        {errorMessage && (
          <div
            className="
              absolute top-[-72px] md:top-0 left-1/2 z-50
              flex items-center gap-3 px-6 py-3
              rounded-b-xl w-[calc(100%-2rem)] max-w-lg
              bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
              border-b border-red-200 dark:border-red-500/30
              animate-slide-down
            "
          >
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {errorMessage}
            </p>
            {showUpgradeCta && (
              <button
                type="button"
                onClick={() => router.push(BILLING_SETTINGS_HREF)}
                className="flex-shrink-0 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                Upgrade
              </button>
            )}
            <button
              onClick={() => {
                setErrorMessage(null);
                setShowUpgradeCta(false);
                setIsCreditError(false);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss error"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}


      {/* Scrollable content region (scrolls when viewport height is small) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center py-4 px-6 sm:p-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* --- Header Text (Theme-Aware) --- */}
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">Resume Optimizer</h1>
        <p className="text-slate-500 dark:text-gray-400 text-center mb-8">
          Upload your resume to get started. We&apos;ll help you tailor it to the job you want.
        </p>

        {pdfUrl ? (
          // --- RESULT PREVIEW BOX (Theme-Aware) ---
          <div className="animate-fade-in-up-sm">
            <div className="relative group w-full h-[min(550px,60dvh)] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="Tailored Resume Preview"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white to-transparent dark:from-slate-900 pointer-events-none" />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <a
                  href={pdfUrl}
                  download="Tailored_Resume.pdf"
                  className="flex items-center gap-2 bg-violet-600 dark:bg-btnDark dark:hover:brightness-[.9] text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-violet-700 transition-transform transform hover:scale-105"
                >
                  <FiDownload className="w-5 h-5" />
                  Download PDF
                </a>
              </div>
            </div>
            <button
                onClick={handleStartOver}
                className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 dark:focus:ring-purple-500"
            >
                Start Over
            </button>
          </div>
        ) : !uploadedFile ? (
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
        ) : (
          // --- FILE UPLOADED, SHOW FORM (Theme-Aware) ---
          <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in-up-sm">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
                <div className="flex items-center gap-3 min-w-0"><FiFileText className="text-violet-500 dark:text-[#818CF8] w-6 h-6 flex-shrink-0" /><span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{uploadedFile.name}</span></div>
                <button onClick={handleRemoveFile} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors" aria-label="Remove file"><FiX className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4" onSubmit={handleProceed}>
              <div><label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Job Title</label><input type="text" autoComplete="off" id="jobTitle" value={jobTitle} required onChange={(e) => setJobTitle(e.target.value)} disabled={isProcessing} className="block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:focus:ring-btnDark/95 sm:text-sm" placeholder="e.g., Senior Software Engineer"/></div>
              <div><label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Job Description</label><textarea id="jobDescription" rows={6} value={jobDescription} required onChange={(e) => setJobDescription(e.target.value)} disabled={isProcessing} className="block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:focus:ring-btnDark/95 sm:text-sm" placeholder="Paste the full job description here..."/></div>
              <button type="submit" disabled={isProcessing} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 dark:focus:ring-purple-500 transition-colors">{isProcessing ? "Processing..." : "Generate"}</button>
            </form>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuild;