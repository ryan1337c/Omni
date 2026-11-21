'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, X } from 'lucide-react';
import BentoTile from './BentoTile';
import { CARD, MUTED } from './styles';

const TITLE = 'World Capitals';
const CHAR_MS = 75;
const TYPE_TAIL_MS = 400;

type Phase =
  | 'center'
  | 'toTitle'
  | 'clickTitle'
  | 'type'
  | 'toBtn'
  | 'click'
  | 'slideTake'
  | 'toOption'
  | 'pick'
  | 'afterPick'
  | 'slideReview'
  | 'hold'
  | 'reset';

type AnimState = {
  phase: Phase;
  typed: number;
  selected: boolean;
};

type CursorState = {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
  instant: boolean;
};

const INITIAL_STATE: AnimState = { phase: 'center', typed: 0, selected: false };
const REDUCED_STATE: AnimState = { phase: 'hold', typed: TITLE.length, selected: true };
const HIDDEN_CURSOR: CursorState = { x: 0, y: 0, visible: false, pressed: false, instant: true };

const PHASE_MS: Record<Phase, number> = {
  center: 700,
  toTitle: 560,
  clickTitle: 320,
  type: 0,
  toBtn: 560,
  click: 320,
  slideTake: 720,
  toOption: 560,
  pick: 300,
  afterPick: 520,
  slideReview: 720,
  hold: 1800,
  reset: 420,
};

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServerSnapshot = () => false;

const nextPhase = (state: AnimState): AnimState => {
  switch (state.phase) {
    case 'center':
      return { ...state, phase: 'toTitle' };
    case 'toTitle':
      return { ...state, phase: 'clickTitle' };
    case 'clickTitle':
      return { ...state, phase: 'type' };
    case 'type':
      return { ...state, phase: 'toBtn' };
    case 'toBtn':
      return { ...state, phase: 'click' };
    case 'click':
      return { ...state, phase: 'slideTake' };
    case 'slideTake':
      return { ...state, phase: 'toOption' };
    case 'toOption':
      return { ...state, phase: 'pick' };
    case 'pick':
      return { ...state, phase: 'afterPick', selected: true };
    case 'afterPick':
      return { ...state, phase: 'slideReview' };
    case 'slideReview':
      return { ...state, phase: 'hold' };
    case 'hold':
      return { ...state, phase: 'reset' };
    case 'reset':
      return INITIAL_STATE;
  }
};

const posFor = (phase: Phase): 'center' | 'create-take' | 'take-review' => {
  if (phase === 'slideReview' || phase === 'hold' || phase === 'reset') return 'take-review';
  if (phase === 'slideTake' || phase === 'toOption' || phase === 'pick' || phase === 'afterPick') {
    return 'create-take';
  }
  return 'center';
};

const focusFor = (phase: Phase): 1 | 2 | 3 => {
  if (phase === 'slideReview' || phase === 'hold' || phase === 'reset') return 3;
  if (phase === 'slideTake' || phase === 'toOption' || phase === 'pick' || phase === 'afterPick') return 2;
  return 1;
};

const Badge = ({ n, label }: { n: number; label: string }) => (
  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 lg:mb-1.5 lg:gap-2 lg:text-sm dark:text-slate-100">
    <span className="grid h-[18px] w-[18px] place-items-center rounded bg-indigo-500 text-[10px] font-bold text-white lg:h-6 lg:w-6 lg:rounded-md lg:text-xs">
      {n}
    </span>
    {label}
  </p>
);

const Arrow = ({ n, drawn }: { n: 1 | 2; drawn: boolean }) => (
  <span
    className="bento-quiz-arrow mt-6 flex shrink-0 items-center justify-center self-center text-indigo-400 lg:mt-8"
    data-arrow={String(n)}
    data-drawn={drawn ? 'true' : 'false'}
    aria-hidden="true"
  >
    <svg viewBox="0 0 28 8" fill="none" className="w-[85%] overflow-visible" preserveAspectRatio="xMidYMid meet">
      <path d="M0 4h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 4" />
      <path d="M21 1l5 3-5 3z" fill="currentColor" />
    </svg>
  </span>
);

const PointerCursor = ({ cursor }: { cursor: CursorState }) => (
  <div
    aria-hidden="true"
    className="bento-quiz-cursor"
    data-visible={cursor.visible ? 'true' : 'false'}
    data-pressed={cursor.pressed ? 'true' : 'false'}
    data-instant={cursor.instant ? 'true' : 'false'}
    style={{
      transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0) scale(${cursor.pressed ? 0.86 : 1})`,
    }}
  >
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 drop-shadow-[0_2px_5px_rgba(0,0,0,0.32)] lg:h-6 lg:w-6"
      fill="none"
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
        fill="#111827"
        stroke="#ffffff"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const ROW = 'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] lg:gap-2 lg:rounded-lg lg:px-2.5 lg:py-1 lg:text-xs';
const ROW_IDLE = `${ROW} border-[#e6e2ec] bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300`;
const ROW_SELECTED = `${ROW} border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-400/50 dark:bg-indigo-400/15 dark:text-indigo-100`;
const BOX = 'h-2.5 w-2.5 shrink-0 rounded-[3px] border border-slate-400 lg:h-3 lg:w-3';
const STEP = `${CARD} bento-step p-3 lg:rounded-xl lg:p-3.5`;
const STEP_TITLE = 'text-[11px] font-semibold text-slate-800 lg:text-[13px] dark:text-slate-100';

const cursorOn = (stage: HTMLElement, target: HTMLElement, kind: 'title' | 'btn' | 'option'): Pick<CursorState, 'x' | 'y'> => {
  const s = stage.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  if (kind === 'title') return { x: r.left - s.left + Math.min(r.width - 8, 72), y: r.top - s.top + r.height * 0.45 };
  if (kind === 'btn') return { x: r.left - s.left + r.width * 0.62, y: r.top - s.top + r.height * 0.45 };
  return { x: r.left - s.left + r.width * 0.7, y: r.top - s.top + r.height * 0.4 };
};

const QuizTile = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const optionRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [state, setState] = useState<AnimState>(INITIAL_STATE);
  const [cursor, setCursor] = useState<CursorState>(HIDDEN_CURSOR);
  const reducedMotion = useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    getReducedServerSnapshot,
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '60px' },
    );
    observer.observe(el);
    const raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (r.bottom > -60 && r.top < vh + 60) setIsInView(true);
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !isInView) return;

    const place = (
      target: HTMLElement | null,
      kind: 'title' | 'btn' | 'option',
      visible: boolean,
      pressed: boolean,
      instant: boolean,
      offset?: { x: number; y: number },
    ) => {
      const stage = stageRef.current;
      if (!stage || !target) {
        setCursor(HIDDEN_CURSOR);
        return;
      }
      const at = cursorOn(stage, target, kind);
      setCursor({
        x: at.x + (offset?.x ?? 0),
        y: at.y + (offset?.y ?? 0),
        visible,
        pressed,
        instant,
      });
    };

    const armCursor = (phase: Phase) => {
      if (phase === 'toTitle') {
        place(titleRef.current, 'title', true, false, true, { x: -22, y: -26 });
        requestAnimationFrame(() => {
          place(titleRef.current, 'title', true, false, false);
        });
        return;
      }
      if (phase === 'clickTitle') {
        place(titleRef.current, 'title', true, true, false);
        return;
      }
      if (phase === 'type') {
        place(titleRef.current, 'title', true, false, false);
        return;
      }
      if (phase === 'toBtn') {
        place(btnRef.current, 'btn', true, false, false);
        return;
      }
      if (phase === 'click') {
        place(btnRef.current, 'btn', true, true, false);
        return;
      }
      if (phase === 'toOption') {
        place(optionRef.current, 'option', true, false, true, { x: -18, y: -28 });
        requestAnimationFrame(() => {
          place(optionRef.current, 'option', true, false, false);
        });
        return;
      }
      if (phase === 'pick') {
        place(optionRef.current, 'option', true, true, false);
        return;
      }
      if (phase === 'afterPick') {
        place(optionRef.current, 'option', true, false, false);
        return;
      }
      setCursor((prev) => ({ ...prev, visible: false, pressed: false, instant: false }));
    };

    if (state.phase === 'type' && state.typed < TITLE.length) {
      const id = window.setTimeout(() => {
        setState((prev) => ({ ...prev, typed: Math.min(TITLE.length, prev.typed + 1) }));
        if (state.typed === 0) armCursor('type');
      }, CHAR_MS);
      return () => window.clearTimeout(id);
    }

    const delay = state.phase === 'type' ? TYPE_TAIL_MS : PHASE_MS[state.phase];
    const id = window.setTimeout(() => {
      const next = nextPhase(state);
      setState(next);
      armCursor(next.phase);
    }, delay);
    return () => window.clearTimeout(id);
  }, [isInView, reducedMotion, state]);

  const view = reducedMotion ? REDUCED_STATE : state;
  const pos = posFor(view.phase);
  const focus = focusFor(view.phase);
  const arrow1 = pos === 'create-take' || pos === 'take-review';
  const arrow2 = pos === 'take-review';
  const titleFocused = view.phase === 'clickTitle' || view.phase === 'type';
  const showCaret = !reducedMotion && titleFocused;
  const titleText = view.typed === 0 && !titleFocused ? null : TITLE.slice(0, view.typed);
  const shownCursor = reducedMotion ? HIDDEN_CURSOR : cursor;

  return (
    <BentoTile
      title="Quizzes from your notes"
      href="/pages/home"
      linkLabel="Open Omni to create a quiz"
      className="bento-pin bento-pin-tr md:col-span-2 lg:col-span-7 lg:min-h-[340px]"
    >
      <p className="sr-only">
        Create a quiz manually or with AI, take it one question at a time, then review your answers and score.
      </p>

      <div className="relative z-10 flex h-full items-center px-4 pb-5 pt-14 sm:px-5 lg:px-6 lg:pb-5 lg:pt-[60px]">
        <div
          ref={stageRef}
          aria-hidden="true"
          className="bento-quiz-stage relative w-full"
          data-quiz-inview={isInView ? 'true' : 'false'}
          data-quiz-phase={view.phase}
          data-quiz-pos={pos}
          data-typed={String(view.typed)}
          data-selected={view.selected ? 'true' : 'false'}
        >
          <div className="bento-quiz-fade">
            <div className="bento-quiz-track">
              <div className="bento-quiz-col" data-col="1">
                <Badge n={1} label="Create" />
                <div className={STEP} data-step="1" data-active={focus === 1 ? 'true' : 'false'}>
                  <p className={STEP_TITLE}>Create New Quiz</p>
                  <div className="mt-2 flex w-fit items-center rounded-md bg-slate-100 p-0.5 text-[10px] lg:mt-3 lg:text-xs dark:bg-white/5">
                    <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 ${MUTED}`}>Manual</span>
                    <span className="rounded bg-indigo-500 px-2.5 py-0.5 font-medium text-white lg:px-3 lg:py-1">AI</span>
                  </div>
                  <div
                    ref={titleRef}
                    className="bento-quiz-title relative mt-2 flex min-h-[28px] items-center rounded-md border bg-slate-50 px-2 py-1.5 text-[11px] lg:mt-3 lg:min-h-[38px] lg:rounded-lg lg:px-3 lg:py-2.5 lg:text-[13px] dark:bg-white/5"
                    data-focused={titleFocused ? 'true' : 'false'}
                  >
                    {titleText === null || titleText === '' ? (
                      <span className={MUTED}>
                        Quiz Title
                        {showCaret ? <span className="bento-quiz-caret" /> : null}
                      </span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-200">
                        {titleText}
                        {showCaret ? <span className="bento-quiz-caret" /> : null}
                      </span>
                    )}
                    {view.phase === 'clickTitle' ? (
                      <span className="bento-click-ring pointer-events-none absolute inset-0 rounded-md lg:rounded-lg" />
                    ) : null}
                  </div>
                  <div
                    ref={btnRef}
                    className="bento-quiz-generate mt-2 rounded-md bg-indigo-500 py-1.5 text-center text-[11px] font-medium text-white lg:mt-3 lg:rounded-lg lg:py-2.5 lg:text-[13px]"
                  >
                    Generate Quiz
                    {view.phase === 'click' ? <span className="bento-click-ring pointer-events-none absolute inset-0 rounded-md lg:rounded-lg" /> : null}
                  </div>
                </div>
              </div>

              <Arrow n={1} drawn={arrow1} />

              <div className="bento-quiz-col" data-col="2">
                <Badge n={2} label="Take quiz" />
                <div className={STEP} data-step="2" data-active={focus === 2 ? 'true' : 'false'}>
                  <p className={STEP_TITLE}>Question 3 of 10</p>
                  <p className={`mt-0.5 text-[10px] lg:mt-1 lg:text-xs ${MUTED}`}>What is the capital of France?</p>
                  <div className="mt-2 space-y-1 lg:mt-3 lg:space-y-1.5">
                    <div
                      ref={optionRef}
                      className={view.selected ? ROW_SELECTED : ROW_IDLE}
                      data-quiz-option="paris"
                    >
                      <span className={`${BOX} ${view.selected ? 'border-indigo-400 bg-indigo-500' : ''}`} />
                      Paris
                    </div>
                    {['London', 'Berlin', 'Madrid'].map((city) => (
                      <div key={city} className={ROW_IDLE}>
                        <span className={BOX} />
                        {city}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Arrow n={2} drawn={arrow2} />

              <div className="bento-quiz-col" data-col="3">
                <Badge n={3} label="Review" />
                <div className={STEP} data-step="3" data-active={focus === 3 ? 'true' : 'false'}>
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
          </div>

          <PointerCursor cursor={shownCursor} />
        </div>
      </div>
    </BentoTile>
  );
};

export default QuizTile;
