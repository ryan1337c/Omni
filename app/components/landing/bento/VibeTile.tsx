'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import BentoTile from './BentoTile';

const PROMPT = 'Write a 25-minute study timer hook';
const CHAR_MS = 75;
const TYPE_TAIL_MS = 400;
const LINE_MS = 300;
const LINE_ANIM_MS = 340;

type Kind = 'k' | 'f' | 's' | 'n' | 'p';
type Token = readonly [Kind, string];

const CODE: ReadonlyArray<ReadonlyArray<Token>> = [
  [
    ['k', 'export'],
    ['p', ' '],
    ['k', 'function'],
    ['p', ' '],
    ['f', 'useStudyTimer'],
    ['p', '() {'],
  ],
  [
    ['p', '  '],
    ['k', 'const'],
    ['p', ' [sec, setSec] = '],
    ['f', 'useState'],
    ['p', '('],
    ['n', '1500'],
    ['p', ');'],
  ],
  [
    ['p', '  '],
    ['f', 'useEffect'],
    ['p', '(() => {'],
  ],
  [
    ['p', '    '],
    ['k', 'const'],
    ['p', ' id = '],
    ['f', 'setInterval'],
    ['p', '(() => '],
    ['f', 'setSec'],
    ['p', '((s) => s - '],
    ['n', '1'],
    ['p', '), '],
    ['n', '1000'],
    ['p', ');'],
  ],
  [
    ['p', '    '],
    ['k', 'return'],
    ['p', ' () => '],
    ['f', 'clearInterval'],
    ['p', '(id);'],
  ],
  [['p', '  }, []);']],
  [
    ['p', '  '],
    ['k', 'return'],
    ['p', ' sec;'],
  ],
  [['p', '}']],
];

const TOKEN_CLASS: Record<Kind, string> = {
  k: 'text-[#7c3aed] dark:text-indigo-400',
  f: 'text-[#0d9488] dark:text-sky-300',
  s: 'text-[#db2777] dark:text-pink-300',
  n: 'text-[#ea580c] dark:text-orange-300',
  p: 'text-[#1e1e28] dark:text-slate-200',
};

type Phase = 'idle' | 'toPrompt' | 'clickPrompt' | 'type' | 'toSend' | 'clickSend' | 'fill' | 'hold' | 'reset';

type AnimState = {
  phase: Phase;
  typed: number;
  lines: number;
};

type CursorState = {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
  instant: boolean;
};

const INITIAL_STATE: AnimState = { phase: 'idle', typed: 0, lines: 0 };
const REDUCED_STATE: AnimState = { phase: 'hold', typed: PROMPT.length, lines: CODE.length };
const HIDDEN_CURSOR: CursorState = { x: 0, y: 0, visible: false, pressed: false, instant: true };

const PHASE_MS: Record<Phase, number> = {
  idle: 600,
  toPrompt: 560,
  clickPrompt: 320,
  type: 0,
  toSend: 500,
  clickSend: 320,
  fill: 0,
  hold: 1800,
  reset: 400,
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
    case 'idle':
      return { ...state, phase: 'toPrompt' };
    case 'toPrompt':
      return { ...state, phase: 'clickPrompt' };
    case 'clickPrompt':
      return { ...state, phase: 'type' };
    case 'type':
      return { ...state, phase: 'toSend' };
    case 'toSend':
      return { ...state, phase: 'clickSend' };
    case 'clickSend':
      return { ...state, phase: 'fill' };
    case 'fill':
      return { ...state, phase: 'hold' };
    case 'hold':
      return { ...state, phase: 'reset' };
    case 'reset':
      return INITIAL_STATE;
  }
};

const PointerCursor = ({ cursor }: { cursor: CursorState }) => (
  <div
    aria-hidden="true"
    className="bento-code-cursor"
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

const cursorOn = (
  stage: HTMLElement,
  target: HTMLElement,
  kind: 'prompt' | 'send',
): Pick<CursorState, 'x' | 'y'> => {
  const s = stage.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  if (kind === 'prompt') {
    return { x: r.left - s.left + Math.min(r.width - 28, 86), y: r.top - s.top + r.height * 0.45 };
  }
  return { x: r.left - s.left + r.width * 0.45, y: r.top - s.top + r.height * 0.45 };
};

const VibeTile = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLDivElement>(null);
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
      kind: 'prompt' | 'send',
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
      if (phase === 'toPrompt') {
        place(promptRef.current, 'prompt', true, false, true, { x: -20, y: -24 });
        requestAnimationFrame(() => {
          place(promptRef.current, 'prompt', true, false, false);
        });
        return;
      }
      if (phase === 'clickPrompt') {
        place(promptRef.current, 'prompt', true, true, false);
        return;
      }
      if (phase === 'type') {
        place(promptRef.current, 'prompt', true, false, false);
        return;
      }
      if (phase === 'toSend') {
        place(sendRef.current, 'send', true, false, false);
        return;
      }
      if (phase === 'clickSend') {
        place(sendRef.current, 'send', true, true, false);
        return;
      }
      setCursor((prev) => ({ ...prev, visible: false, pressed: false, instant: false }));
    };

    if (state.phase === 'type' && state.typed < PROMPT.length) {
      const id = window.setTimeout(() => {
        setState((prev) => ({ ...prev, typed: Math.min(PROMPT.length, prev.typed + 1) }));
        if (state.typed === 0) armCursor('type');
      }, CHAR_MS);
      return () => window.clearTimeout(id);
    }

    if (state.phase === 'fill' && state.lines < CODE.length) {
      const id = window.setTimeout(
        () => {
          setState((prev) => ({ ...prev, lines: Math.min(CODE.length, prev.lines + 1) }));
        },
        state.lines === 0 ? 40 : LINE_MS,
      );
      return () => window.clearTimeout(id);
    }

    const delay =
      state.phase === 'type' ? TYPE_TAIL_MS : state.phase === 'fill' ? LINE_ANIM_MS : PHASE_MS[state.phase];
    const id = window.setTimeout(() => {
      const next = nextPhase(state);
      setState(next);
      armCursor(next.phase);
    }, delay);
    return () => window.clearTimeout(id);
  }, [isInView, reducedMotion, state]);

  const view = reducedMotion ? REDUCED_STATE : state;
  const promptFocused = view.phase === 'clickPrompt' || view.phase === 'type';
  const showCaret = !reducedMotion && promptFocused;
  const promptText = view.typed > 0 ? PROMPT.slice(0, view.typed) : '';
  const shownCursor = reducedMotion ? HIDDEN_CURSOR : cursor;
  const visibleLines = view.lines;

  return (
    <BentoTile
      title="Code Assisting"
      href="/pages/home"
      linkLabel="Open Omni for code assisting"
      className="h-[324px] min-h-[324px] md:col-span-2 lg:h-[360px] lg:min-h-[360px] lg:col-span-6"
    >
      <p className="sr-only">Tell Omni what to write and it fills in the code for you.</p>

      <div
        ref={stageRef}
        aria-hidden="true"
        className="bento-code-stage relative z-10 flex h-full flex-col px-4 pb-3 pt-14 sm:px-5 lg:px-6 lg:pb-4 lg:pt-[60px]"
        data-code-inview={isInView ? 'true' : 'false'}
        data-code-phase={view.phase}
        data-typed={String(view.typed)}
        data-lines={String(visibleLines)}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#e6e2ec] bg-white shadow-[0_6px_16px_rgba(90,60,140,0.12)] lg:rounded-xl dark:border-white/10 dark:bg-[#1e2633] dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)]">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-[#ece8ee] px-3 py-1.5 lg:gap-2 lg:px-4 lg:py-2 dark:border-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] lg:h-3 lg:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f5b400] lg:h-3 lg:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] lg:h-3 lg:w-3" />
              <span className="ml-3 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 lg:px-2.5 lg:py-1 lg:text-[13px] dark:bg-white/5 dark:text-slate-400">
                useStudyTimer.ts
              </span>
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden font-mono text-[10.5px] leading-4 sm:text-xs md:text-[13px] md:leading-[18px] lg:text-[13px] lg:leading-[18px]">
              <div className="bento-code-ink shrink-0 select-none py-1.5 pl-3 pr-3 text-right text-slate-400 lg:py-2 lg:pl-4 lg:pr-4 dark:text-slate-500 min-w-[28px] lg:min-w-[32px]">
                {Array.from({ length: visibleLines }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="bento-code-ink m-0 min-w-0 flex-1 overflow-hidden py-1.5 pr-3 lg:py-2 lg:pr-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] md:[mask-image:none]">
                <code>
                  {CODE.slice(0, visibleLines).map((line, i) => (
                    <span key={i} className="bento-code-line block">
                      {line.map(([kind, text], j) => (
                        <span key={j} className={TOKEN_CLASS[kind]}>
                          {text}
                        </span>
                      ))}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </div>

          <div
            ref={promptRef}
            className="bento-code-prompt relative mt-2 flex min-h-[34px] shrink-0 items-center rounded-[10px] border bg-white px-2.5 py-1.5 shadow-[0_6px_16px_rgba(90,60,140,0.08)] lg:mt-2 lg:min-h-[40px] lg:rounded-xl lg:px-3 lg:py-2 dark:bg-[#1e2633] dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)]"
            data-focused={promptFocused ? 'true' : 'false'}
          >
            <div className="bento-code-prompt-text min-w-0 flex-1 truncate text-[11px] lg:text-[13px]">
              {promptText ? (
                <span className="text-slate-700 dark:text-slate-200">
                  {promptText}
                  {showCaret ? <span className="bento-code-caret" /> : null}
                </span>
              ) : showCaret ? (
                <span className="bento-code-caret" />
              ) : null}
            </div>
            <div
              ref={sendRef}
              className="bento-code-send relative ml-2 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-500 text-white lg:h-8 lg:w-8 lg:rounded-lg"
              data-pressed={view.phase === 'clickSend' ? 'true' : 'false'}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
              {view.phase === 'clickSend' ? (
                <span className="bento-click-ring pointer-events-none absolute inset-0 rounded-md lg:rounded-lg" />
              ) : null}
            </div>
            {view.phase === 'clickPrompt' ? (
              <span className="bento-click-ring pointer-events-none absolute inset-0 rounded-[10px] lg:rounded-xl" />
            ) : null}
          </div>
        </div>

        <PointerCursor cursor={shownCursor} />
      </div>
    </BentoTile>
  );
};

export default VibeTile;
