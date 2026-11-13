"use client"

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  RotateCw
} from 'lucide-react';

export type Flashcard = {
  id: string | number;
  prompt: string;
  answer: string;
};

type DeckViewProps = {
  deckTitle: string;
  cards: Flashcard[];
  onExit: () => void;
}

export default function DeckView({ deckTitle, cards, onExit }: DeckViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasRevealedOnce, setHasRevealedOnce] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!hasRevealedOnce) setHasRevealedOnce(true);
  };

  const currentCard = cards[currentIndex];

  if (!cards || cards.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>This deck is empty.</p>
              <button onClick={onExit} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Go Back</button>
          </div>
      )
  }

  const showHint = currentIndex === 0 && !hasRevealedOnce && !isFlipped;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-gray-900 animate-fade-in relative overflow-hidden">
      
      {/* HEADER */}
      <div className="min-h-16 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 flex-shrink-0 z-20 relative gap-3 sm:gap-6">
         
         {/* Left Side: Exit Button + Title */}
         <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
            <button onClick={onExit} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors shrink-0">
                <X size={20} />
            </button>
            <div className="flex flex-col min-w-0">
                <h2 className="font-bold text-slate-800 dark:text-white text-sm md:text-base truncate">{deckTitle}</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">Card {currentIndex + 1} / {cards.length}</span>
            </div>
         </div>

         {/* Right Side: Progress Bar (Responsive) */}
         <div className="flex items-center gap-3 w-full sm:w-auto pl-11 sm:pl-0">
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:inline">Progress</span>
             <div className="w-full sm:w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 transition-all duration-300 ease-out" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
             </div>
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto w-full">
         
         {/* CARD */}
         <div className="relative w-full max-w-2xl aspect-[3/2] perspective-1000">
             <div className="w-full h-full cursor-pointer group" onClick={handleFlip}>
                <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* FRONT */}
                    <div className="absolute inset-0 backface-hidden w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 md:p-12 text-center relative">
                        <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt</span>
                        <p className="text-xl md:text-3xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed select-none">
                            {currentCard.prompt}
                        </p>
                        {showHint && (
                            <div className="absolute bottom-8 animate-bounce">
                                <span className="text-slate-400 dark:text-slate-500 text-sm font-medium flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                                    <RotateCw size={14} /> Click to reveal
                                </span>
                            </div>
                        )}
                    </div>
                    {/* BACK */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-violet-500 dark:border-violet-600 flex flex-col items-center justify-center p-8 md:p-12 text-center">
                        <span className="absolute top-6 left-6 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Answer</span>
                        <p className="text-lg md:text-2xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed select-none">
                            {currentCard.answer}
                        </p>
                    </div>
                </div>
             </div>
         </div>

         {/* NAVIGATION ARROWS (Immediately Below Card) */}
         <div className="flex items-center justify-center gap-8 w-full max-w-2xl">
            <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0 || isAnimating} 
                className="p-4 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
            >
                <ChevronLeft size={24} />
            </button>

            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                {currentIndex + 1} / {cards.length}
            </span>

            <button 
                onClick={handleNext} 
                disabled={currentIndex === cards.length - 1 || isAnimating} 
                className="p-4 rounded-full bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
            >
                <ChevronRight size={24} />
            </button>
         </div>

      </div>

    </div>
  );
}