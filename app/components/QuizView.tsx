"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  PlayCircle, 
  Pencil, 
  Trash2, 
  HelpCircle,
  Clock,
  AlertTriangle,
  X,
  Timer,     
  Sparkles,   
  User,
  Award
} from 'lucide-react';

import QuizGenerationModal from '@/app/components/quiz-generation';
import QuizActiveModal, { Question, Choice } from './QuizActiveModal'; 
import { PublicServices } from '@/lib/publicServices';
import { AuthServices } from '@/lib/authServices';
import { timeAgo } from '@/lib/utils';
import { createPortal } from 'react-dom';

type QuizViewProps = {
    isProcessing: boolean,
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  mode: string;
  count: number;
  duration: number; 
  created_at: string;
  questions?: Question[]
}

type QuizEditorState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  quizData?: Quiz;
}

// ... (Helpers: formatDuration, formatMode, timeAgo remain the same) ...
const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
};

const formatMode = (mode: string) => {
    if (!mode) return 'Manual';
    return mode.toLowerCase() === 'ai' ? 'AI Generated' : 'Manual';
};

export default function QuizView({ isProcessing, setIsProcessing }: QuizViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [mounted, setMounted] = useState(false); 

  // Quiz edit state
  const [quizEditorState, setQuizEditorState] = useState<QuizEditorState>({
    isOpen: false,
    mode: 'create',
  });

  const [userId, setUserId] = useState<string | null>(null);

  // Saved quiz used to indicate whether a previous quiz is still in progress or in review
  const [savedQuiz, setSavedQuiz] = useState<any>();
  
  // State to track the active quiz session
  const [activeQuizData, setActiveQuizData] = useState<{ id: number, title: string, questions: Question[], duration: number } | null>(null);

  const publicServices = new PublicServices();
  const authServices = new AuthServices();
  
  const [quizToDelete, setQuizToDelete] = useState<{id: number, title: string} | null>(null);

  // Handle mounting and body scroll lock
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const isPopupOpen = !!quizToDelete || quizEditorState.isOpen;
    if (isPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [quizToDelete, quizEditorState.isOpen]);

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const openCreateModal = () => {
    setQuizEditorState({ isOpen: true, mode: 'create'})
  };

  const openEditModal = async (quiz: Quiz) => {
    setIsProcessing(true);
    try {
        // Fetch full questions details before opening modal
        const questions = await publicServices.getQuizQuestions(quiz.id);
        
        setQuizEditorState({ 
            isOpen: true, 
            mode: 'edit', 
            quizData: { ...quiz, questions } 
        });
    } catch (e) {
        console.error(e);
        alert("Could not load quiz for editing.");
    } finally {
        setIsProcessing(false);
    }
  }

  const openDeleteModal = (id: number, title: string) => setQuizToDelete({ id, title });
  const closeDeleteModal = () => setQuizToDelete(null);
  const closeEditorModal = () => {
    setQuizEditorState({ isOpen: false, mode: 'create'});
  }

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    try {
        setIsProcessing(true);
        await publicServices.deleteQuiz(userId, quizToDelete.id);
        setQuizzes(prev => prev.filter(q => q.id !== quizToDelete.id));
        closeDeleteModal();
    }
    catch (error: any) {
        console.log("Error deleting quiz", error);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleQuizCreated = (newQuiz: Quiz) => {
    setQuizzes((prevQuizzes) => [newQuiz, ...prevQuizzes]);
  }

  const handleQuizUpdate = (updatedQuiz: Quiz) => {
      setQuizzes((prevQuizzes) => 
      prevQuizzes.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q))
    );
  }

  // Handle fetching and starting a quiz
  const handleTakeQuiz = async (quiz: Quiz) => {
    setIsProcessing(true);
    try {
        // Fetch specific questions for this quiz ID
        const questions = await publicServices.getQuizQuestions(quiz.id);
        
        if (questions && questions.length > 0) {
            setActiveQuizData({
                id: quiz.id,
                title: quiz.title,
                questions: questions,
                duration: quiz.duration
            });
        } else {
            console.warn("No questions found for this quiz.");
            alert("This quiz has no questions data.");
        }
    } catch (error) {
        console.error("Failed to load quiz questions", error);
        alert("Failed to load quiz. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  // Refreshes the "Continue/Review" button state from local storage
  const refreshSavedSession = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('active_quiz_session');
      setSavedQuiz(saved ? JSON.parse(saved) : null);
    }
  }

  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await authServices.getSession();
        if (session?.user) {
            setUserId(session.user.id);
        }
        const data = await publicServices.getQuizzes(session?.user?.id);
        setQuizzes(data as Quiz[]);

        // Check for saved quiz session
        refreshSavedSession();
      }
      catch (error: any) {
        console.error("Error fetching session", error)
      }
    }
    fetchSession();
  }, []);

  // Conditional render to load actual quiz
  if (activeQuizData) {
    return (
        <QuizActiveModal 
            quizId={activeQuizData.id}
            quizTitle={activeQuizData.title}
            questions={activeQuizData.questions}
            onExit={() => {
              setActiveQuizData(null);
              refreshSavedSession();
            }}
            duration={activeQuizData.duration}
        />
    );
  }

  if (!mounted) return null;

  return (
    <div className="relative flex flex-col h-full w-full text-slate-300 dark:text-gray-200 overflow-y-auto custom-scrollbar animate-fade-in-sm">
      
      {/* Header Section */}
      <div className="w-full max-w-6xl mx-auto py-4 px-6 md:p-10 space-y-8">
        
        {/* Title and Create Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-gray-300">Your Quizzes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and take your generated quizzes.</p>
          </div>
          
          <button 
            disabled={isProcessing}
            onClick={openCreateModal} 
            className="flex items-center  flex-shrink-0 justify-center gap-2 text-white bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] px-5 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>Create New Quiz</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500
                        focus:border-transparent dark:focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Quiz Grid */}
        {filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              // Determine Button state for this specific quiz
              const hasActiveSession = savedQuiz && savedQuiz.quizId === quiz.id;
              const isReviewMode = hasActiveSession && savedQuiz.isSubmitted;

              return (
              <div 
                key={quiz.id} 
                className="group flex flex-col justify-between bg-white dark:bg-slate-800 border border-slate-400 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Content */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium text-slate-800 dark:text-white line-clamp-1" title={quiz.title}>
                      {quiz.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 mb-4" title={quiz.description}>
                    {quiz.description || "No description provided."}
                  </p>
                  
                  {/* Meta Badges Grid */}
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                      <HelpCircle size={12} /> {quiz.count} Qs
                    </span>

                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                      <Timer size={12} /> {formatDuration(quiz.duration)}
                    </span>

                    <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                        quiz.mode === 'ai' 
                            ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300' 
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
                    }`}>
                      {quiz.mode === 'ai' ? <Sparkles size={12} /> : <User size={12} />} 
                      {formatMode(quiz.mode)}
                    </span>

                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md ml-auto lg:ml-0">
                      <Clock size={12} /> {timeAgo(quiz.created_at)}
                    </span>

                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  {/* {savedQuiz && savedQuiz.id === quiz.id? (savedQuiz.isFinished ? <>Review</> : <>Continue</>) : 
                   <>Take Quiz</>} */}
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleTakeQuiz(quiz)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                       hasActiveSession 
                         ? isReviewMode
                            ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30" // Review Style
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30" // Continue Style
                         : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20" // Default Take Quiz
                    }`}>
                     {hasActiveSession ? (
                        isReviewMode ? (
                           <> <Award size={16} /> Review </>
                        ) : (
                           <> <PlayCircle size={16} /> Continue </>
                        )
                    ) : (
                        <> <PlayCircle size={16} /> Take Quiz </>
                    )}
                  </button>

                  {!hasActiveSession && (
                    <button 
                        disabled={isProcessing}
                        onClick={() => openEditModal(quiz)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400 rounded-lg transition-colors"
                        title="Edit Quiz"
                    >
                        <Pencil size={18} />
                    </button>
                  )}

                  <button 
                    disabled={isProcessing}
                    onClick={() => openDeleteModal(quiz.id, quiz.title)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              )})}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No quizzes found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
              We couldn&apos;t find any quizzes matching &quot;{searchTerm}&quot;. Try creating a new one!
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {quizToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-sm">
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Quiz?</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{quizToDelete.title}&quot;</span>? This action cannot be undone.
                </p>
              </div>
              <button onClick={closeDeleteModal} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeDeleteModal} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Delete Quiz</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Generation/Editor Modal */}
      {quizEditorState.isOpen && createPortal(
        <QuizGenerationModal 
            isOpen={quizEditorState.isOpen}
            onClose={closeEditorModal}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            onQuizCreated={handleQuizCreated}
            onQuizUpdated={handleQuizUpdate}
            editMode={quizEditorState.mode === 'edit'}
            initialData={quizEditorState.quizData}
        />,
      document.body
      )}
    </div>
  );
}