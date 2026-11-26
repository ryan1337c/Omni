"use client";

import { useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { useAuth } from '@/app/context/AuthContext';
import {
  formatInsufficientCreditsMessage,
  getInsufficientCreditsInfo,
  shouldOfferCreditUpgrade,
} from '@/lib/credits/usageClient';
import type { TailoredResumeResult } from '@/lib/resume/schema';

import { generateResumeRequest } from './api';
import ResumeResults from './components/ResumeResults';
import ResumeUploadForm from './components/ResumeUploadForm';
import TemporaryErrorToast from "@/app/components/shared/TemporaryErrorToast";

import { RESULTS_TRANSITION_DELAY_MS } from './constants';
import type { ResumeBuildProps, ResumeBuildState, ResumeRequestInput } from './types';

const ResumeBuild = ({ isProcessing, setIsProcessing }: ResumeBuildProps) => {
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
          <TemporaryErrorToast
            message={errorMessage}
            onDismiss={dismissError}
            showUpgradeCta={showUpgradeCta}
            autoDismiss={!isCreditError}
          />
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
