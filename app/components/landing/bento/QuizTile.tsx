import { Check, X } from 'lucide-react';
import BentoTile from './BentoTile';
import InViewGate from './InViewGate';
import { CARD, MUTED } from './styles';

const Badge = ({ n, label }: { n: number; label: string }) => (
  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 lg:mb-1.5 lg:gap-2 lg:text-sm dark:text-slate-100">
    <span className="grid h-[18px] w-[18px] place-items-center rounded bg-indigo-500 text-[10px] font-bold text-white lg:h-6 lg:w-6 lg:rounded-md lg:text-xs">
      {n}
    </span>
    {label}
  </p>
);

// Dotted arrow between steps. Horizontal from `sm` up; rotated to point down when stacked.
const Arrow = () => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center self-center text-indigo-400 max-sm:rotate-90 sm:mt-6 lg:mt-8">
    <svg width="28" height="8" viewBox="0 0 28 8" fill="none" className="overflow-visible">
      <path d="M0 4h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 4" />
      <path d="M21 1l5 3-5 3z" fill="currentColor" />
    </svg>
  </span>
);

const ROW = 'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] lg:gap-2 lg:rounded-lg lg:px-2.5 lg:py-1 lg:text-xs';
const ROW_IDLE = `${ROW} border-[#e6e2ec] bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300`;
const BOX = 'h-2.5 w-2.5 shrink-0 rounded-[3px] border border-slate-400 lg:h-3 lg:w-3';
const STEP = `${CARD} bento-step p-3 lg:rounded-xl lg:p-3.5`;
const STEP_TITLE = 'text-[11px] font-semibold text-slate-800 lg:text-[13px] dark:text-slate-100';

const QuizTile = () => (
  <BentoTile
    title="Quizzes from your notes"
    href="/pages/home"
    linkLabel="Open Omni to create a quiz"
    className="bento-pin bento-pin-tr md:col-span-2 lg:col-span-7 lg:min-h-[340px]"
  >
    <p className="sr-only">
      Create a quiz manually or with AI, take it one question at a time, then review your answers and score.
    </p>

    <InViewGate className="relative z-10 px-4 pb-5 pt-14 sm:px-5 lg:flex lg:h-full lg:items-center lg:px-6 lg:pb-5 lg:pt-[60px]">
      <div aria-hidden="true" className="flex flex-col items-stretch sm:flex-row lg:w-full">
        <div className="min-w-0 flex-1">
          <Badge n={1} label="Create" />
          <div className={STEP} data-step="1">
            <p className={STEP_TITLE}>Create New Quiz</p>
            <div className="mt-2 flex w-fit items-center rounded-md bg-slate-100 p-0.5 text-[10px] lg:mt-3 lg:text-xs dark:bg-white/5">
              <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 ${MUTED}`}>Manual</span>
              <span className="rounded bg-indigo-500 px-2.5 py-0.5 font-medium text-white lg:px-3 lg:py-1">AI</span>
            </div>
            <div className="mt-2 rounded-md border border-[#e6e2ec] bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500 lg:mt-3 lg:rounded-lg lg:px-3 lg:py-2.5 lg:text-[13px] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Quiz Title
            </div>
            <div className="mt-2 rounded-md bg-indigo-500 py-1.5 text-center text-[11px] font-medium text-white lg:mt-3 lg:rounded-lg lg:py-2.5 lg:text-[13px]">
              Generate Quiz
            </div>
          </div>
        </div>

        <Arrow />

        <div className="min-w-0 flex-1">
          <Badge n={2} label="Take quiz" />
          <div className={STEP} data-step="2">
            <p className={STEP_TITLE}>Question 3 of 10</p>
            <p className={`mt-0.5 text-[10px] lg:mt-1 lg:text-xs ${MUTED}`}>What is the capital of France?</p>
            <div className="mt-2 space-y-1 lg:mt-3 lg:space-y-1.5">
              <div className={`${ROW} border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-400/50 dark:bg-indigo-400/15 dark:text-indigo-100`}>
                <span className={`${BOX} border-indigo-400`} />
                Paris
              </div>
              {['London', 'Berlin', 'Madrid'].map((city) => (
                <div key={city} className={ROW_IDLE}>
                  <span className={BOX} />
                  {city}
                </div>
              ))}
            </div>
            <div className="mt-2 h-1 rounded-full bg-indigo-100 lg:mt-3 lg:h-1.5 dark:bg-white/10">
              <div className="h-full w-[60%] rounded-full bg-indigo-500" />
            </div>
          </div>
        </div>

        <Arrow />

        <div className="min-w-0 flex-1">
          <Badge n={3} label="Review" />
          <div className={STEP} data-step="3">
            <p className={STEP_TITLE}>Review answers</p>
            <div className="mt-2 space-y-1.5 lg:mt-3 lg:space-y-2">
              <div className={`${ROW} justify-between border-emerald-300 bg-emerald-50 py-1.5 text-emerald-700 lg:py-2 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300`}>
                <span className="flex items-center gap-1.5 lg:gap-2">
                  <Check className="h-3 w-3 lg:h-3.5 lg:w-3.5" strokeWidth={3} />
                  Paris
                </span>
              </div>
              <div className={`${ROW} justify-between border-red-300 bg-red-50 py-1.5 text-red-600 lg:py-2 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-300`}>
                <span className="flex items-center gap-1.5 lg:gap-2">
                  <X className="h-3 w-3 lg:h-3.5 lg:w-3.5" strokeWidth={3} />
                  London
                </span>
              </div>
            </div>
            <p className="mx-auto mt-2.5 w-fit rounded-md border border-[#e6e2ec] px-3 py-0.5 text-[11px] font-semibold text-slate-700 lg:mt-4 lg:rounded-lg lg:px-4 lg:py-1 lg:text-[13px] dark:border-white/10 dark:text-slate-200">
              8/10
            </p>
          </div>
        </div>
      </div>
    </InViewGate>
  </BentoTile>
);

export default QuizTile;
