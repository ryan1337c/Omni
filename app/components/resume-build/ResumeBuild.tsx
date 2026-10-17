"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/app/context/AuthContext';
import {
  BILLING_SETTINGS_HREF,
  formatInsufficientCreditsMessage,
  getInsufficientCreditsInfo,
  shouldOfferCreditUpgrade,
} from '@/lib/credits/usageClient';
import type { TailoredResumeResult } from '@/lib/resume/schema';

import { generateResumeRequest } from './api';
import ResumeResults from './components/ResumeResults';
import ResumeUploadForm from './components/ResumeUploadForm';
import { ERROR_TOAST_DURATION_MS, RESULTS_TRANSITION_DELAY_MS } from './constants';
import type { ResumeBuildProps, ResumeBuildState, ResumeRequestInput } from './types';

const ResumeBuild = ({ isProcessing, setIsProcessing }: ResumeBuildProps) => {
  const router = useRouter();
  const { tier } = useAuth();
  const [state, setState] = useState<ResumeBuildState>({ step: "upload" });
  const [isTailoring, setIsTailoring] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradeCta, setShowUpgradeCta] = useState(false);
  const [isCreditError, setIsCreditError] = useState(false);

  const showError = (message: string) => {
    setShowUpgradeCta(false);
    setIsCreditError(false);
    setErrorMessage(message);
  };

  const dismissError = () => {
    setErrorMessage(null);
    setShowUpgradeCta(false);
    setIsCreditError(false);
  };

  const handleGenerate = async (input: ResumeRequestInput) => {
    dismissError();
    setIsTailoring(true);
    setIsProcessing(true);

    let tailored: TailoredResumeResult | null = null;

    try {
      const { result, data } = await generateResumeRequest(input);

      if (!result.ok) {
        const creditInfo = getInsufficientCreditsInfo(result.status, data);
        if (creditInfo) {
          setErrorMessage(formatInsufficientCreditsMessage(creditInfo, tier));
          setShowUpgradeCta(shouldOfferCreditUpgrade(tier));
          setIsCreditError(true);
          return;
        }
        throw new Error(data.error || 'Something went wrong');
      }

      tailored = data as TailoredResumeResult;
    } catch (error: any) {
      console.error('Fetch failed: ', error.message || error);
      setErrorMessage(`An error occurred: ${error.message}`);
    } finally {
      setIsTailoring(false);
      setIsProcessing(false);

      if (tailored) {
        const ready = tailored;
        setTimeout(() => {
          setState({ step: "results", tailored: ready, jobTitle: input.jobTitle });
        }, RESULTS_TRANSITION_DELAY_MS);
      }
    }
  };

  // Auto-dismiss the error popup after a few seconds
  useEffect(() => {
    if (!errorMessage || isCreditError) return;
    const timer = setTimeout(() => setErrorMessage(null), ERROR_TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [errorMessage, isCreditError]);

  const handleStartOver = () => {
    dismissError();
    setState({ step: "upload" });
  };

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
              onClick={dismissError}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss error"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}


      {state.step === "upload" ? (
        // Scrollable content region (scrolls when viewport height is small)
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center py-4 px-6 sm:p-8">
            <div className="w-full max-w-2xl mx-auto">
              {/* --- Header Text (Theme-Aware) --- */}
              <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">Resume Optimizer</h1>
              <p className="text-slate-500 dark:text-gray-400 text-center mb-8">
                Upload your resume to get started. We&apos;ll help you tailor it to the job you want.
              </p>

              <ResumeUploadForm
                isProcessing={isProcessing}
                onSubmit={handleGenerate}
                onError={showError}
              />
            </div>
          </div>
        </div>
      ) : (
        // Full-width results; it manages its own scrolling.
        <ResumeResults
          tailored={state.tailored}
          jobTitle={state.jobTitle}
          onStartOver={handleStartOver}
          onError={showError}
        />
      )}
    </div>
  );
};

export default ResumeBuild;
