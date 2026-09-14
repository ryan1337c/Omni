'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { VscMic } from "react-icons/vsc";
import { X } from 'lucide-react';

// Props the component will accept
interface SpeechRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (transcript: string) => void;
}

const SpeechRecognitionModal = ({ isOpen, onClose, onTranscript }: SpeechRecognitionModalProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please try Chrome or Edge.');
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Iterate through the entire results list that the API provides.
      for (let i = 0; i < event.results.length; ++i) {
        // Concatenate the transcript parts.
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setTranscript(finalTranscript + interimTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, onClose]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Clear previous results for a clean start.
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const handleInsert = () => {
    onTranscript(transcript);
    setTranscript(''); 
    onClose();
  };
  
  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTranscript(''); 
    onClose();
  };
  
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto p-6 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Dictate your message</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className={`relative w-24 h-24 flex items-center justify-center rounded-full mb-6 ${isListening ? 'bg-red-100 dark:bg-red-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {isListening && <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>}
                <VscMic size="40px" className={`z-10 ${isListening ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300'}`} />
            </div>
            <p className="min-h-[50px] max-h-[30vh] overflow-y-auto text-gray-700 dark:text-gray-200 w-full p-2 border-none rounded-md">
                {transcript || (isListening ? 'Listening...' : 'Click "Start" to begin dictation.')}
            </p>
        </div>
        <div className="mt-6 flex justify-between items-center">
            <button
              onClick={handleToggleListening}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                isListening 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isListening ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={handleInsert}
              disabled={!transcript || isListening}
              className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 dark:bg-btnDark dark:hover:brightness-[.9] dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Insert
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SpeechRecognitionModal;