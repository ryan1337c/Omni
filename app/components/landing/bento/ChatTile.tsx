import { ChevronDown, Paperclip, SendHorizontal, Sparkles, X } from 'lucide-react';
import BentoTile from './BentoTile';
import Swoosh from './Swoosh';
import { CARD, CARD_SURFACE, MUTED } from './styles';

// Four tiny abstract "generated image" thumbnails, drawn as inline SVG (a few shapes each).
const Thumbs = () => (
  <>
    <svg viewBox="0 0 80 60" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      <defs>
        <linearGradient id="bt1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect width="80" height="60" fill="url(#bt1)" />
      <circle cx="26" cy="24" r="19" fill="#f472b6" />
      <path d="M40 6c18 2 30 14 24 30-5 12-22 10-26-2s-2-20 2-28z" fill="#2563eb" opacity="0.9" />
      <ellipse cx="22" cy="46" rx="22" ry="9" fill="#fb923c" />
      <circle cx="58" cy="44" r="7" fill="#fde047" />
    </svg>
    <svg viewBox="0 0 80 60" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      <defs>
        <linearGradient id="bt2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9c3b6" />
          <stop offset="1" stopColor="#8b6b5e" />
        </linearGradient>
      </defs>
      <rect width="80" height="60" fill="url(#bt2)" />
      <rect x="8" y="0" width="10" height="60" fill="#efe0d5" />
      <rect x="26" y="0" width="10" height="60" fill="#6b4f45" opacity="0.8" />
      <rect x="44" y="0" width="10" height="60" fill="#efe0d5" />
      <rect x="62" y="0" width="10" height="60" fill="#6b4f45" opacity="0.8" />
      <path d="M0 60L80 18V0H0z" fill="#fff" opacity="0.18" />
    </svg>
    <svg viewBox="0 0 80 60" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      <defs>
        <linearGradient id="bt3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c2d12" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="80" height="60" fill="url(#bt3)" />
      <path d="M0 40L30 6l22 30z" fill="#fdba74" opacity="0.85" />
      <path d="M26 60L56 14l24 46z" fill="#9a3412" opacity="0.9" />
      <path d="M10 60l20-26 18 26z" fill="#fed7aa" opacity="0.7" />
    </svg>
    <svg viewBox="0 0 80 60" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      <defs>
        <radialGradient id="bt4" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#f9a8d4" />
          <stop offset="1" stopColor="#f5efe9" />
        </radialGradient>
      </defs>
      <rect width="80" height="60" fill="#1c1917" />
      <rect x="14" y="8" width="52" height="44" rx="3" fill="url(#bt4)" />
      <rect x="14" y="8" width="52" height="44" rx="3" fill="none" stroke="#fff" strokeOpacity="0.7" />
    </svg>
  </>
);

const ChatTile = () => (
  <BentoTile
    title="Chat and generate with any AI model"
    href="/pages/home"
    linkLabel="Open Omni to chat and generate images"
    className="sm:min-h-[320px] md:col-span-2 lg:col-span-8 lg:min-h-[400px]"
    art={<Swoosh id="bento-sw-a" side="a" />}
  >
    <p className="sr-only">
      Chat with GPT, Claude or Gemini from one input, and generate images from a text prompt.
    </p>

    <div
      aria-hidden="true"
      className="relative z-10 flex flex-col gap-4 px-4 pb-5 pt-[76px] sm:flex-row sm:gap-5 sm:px-6 sm:pt-14 lg:gap-7 lg:px-8 lg:pb-8 lg:pt-[76px]"
    >
      {/* Chat input with the model picker overlapping its bottom-right corner */}
      <div className="relative min-w-0 flex-1 pb-12 sm:pt-1 lg:pb-[72px]">
        <div className={`${CARD} px-3.5 py-3 lg:rounded-xl lg:px-5 lg:py-4`}>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-px bg-indigo-400 lg:h-5" />
            <span className={`min-w-0 flex-1 truncate text-[11px] lg:text-sm ${MUTED}`}>Ask Omni anything…</span>
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400 lg:h-[18px] lg:w-[18px]" />
            <SendHorizontal className="h-3.5 w-3.5 shrink-0 text-indigo-500 lg:h-[18px] lg:w-[18px] dark:text-indigo-400" />
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 lg:mt-4 lg:space-y-2.5 lg:pt-4 dark:border-white/5">
            <p className="truncate text-[10px] text-slate-400 lg:text-[13px]">Summarize chapter 4 in five bullet points</p>
            <p className="truncate text-[10px] text-slate-400 lg:text-[13px]">Explain this error and suggest a fix</p>
          </div>
        </div>

        <div className={`${CARD} absolute right-2 top-[66px] w-[150px] px-3 py-2.5 sm:-right-3 lg:-right-4 lg:top-[100px] lg:w-[176px] lg:rounded-xl xl:w-[196px] lg:px-4 lg:py-3.5`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-800 lg:text-[15px] dark:text-slate-100">
            <span>GPT</span>
            <X className="h-3 w-3 text-slate-400 lg:h-4 lg:w-4" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-800 lg:mt-3 lg:gap-2 lg:text-[15px] dark:text-slate-100">
            <span>Claude</span>
            {/* The one place gradient text is used: Google's Gemini brand colours */}
            <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
              Gemini
            </span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-500 lg:h-[18px] lg:w-[18px] dark:text-slate-300" />
          </div>
        </div>
      </div>

      {/* Generate images card */}
      <div className={`${CARD_SURFACE} mx-auto w-[210px] shrink-0 rounded-[10px] p-2.5 sm:mx-0 sm:w-[200px] lg:w-[236px] lg:rounded-xl lg:p-3.5 xl:w-[272px]`}>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-[13px] text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">
          <Sparkles className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          Generate images
        </span>
        <div className="mt-2 grid grid-cols-2 gap-1.5 lg:mt-3 lg:gap-2 [&>svg]:aspect-[4/3] [&>svg]:overflow-hidden [&>svg]:rounded-md">
          <Thumbs />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400 lg:mt-3 lg:text-xs">
          <span className="truncate">Neon city at dusk</span>
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-slate-400/80 px-1 text-[10px] lg:h-6 lg:min-w-6 lg:text-xs font-medium text-white">
            4
          </span>
        </div>
      </div>
    </div>
  </BentoTile>
);

export default ChatTile;
