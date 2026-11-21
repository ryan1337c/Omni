'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { AiOutlineSend } from 'react-icons/ai';
import { CiSquarePlus } from 'react-icons/ci';
import { VscMic } from 'react-icons/vsc';
import BentoTile from './BentoTile';
import Swoosh from './Swoosh';
import { CARD, MUTED } from './styles';

type ChatMessage =
  | { id: 'u1'; role: 'user'; kind: 'text'; text: string }
  | { id: 'a1'; role: 'ai'; kind: 'text'; status: 'typing' | 'done'; text: string }
  | { id: 'u2'; role: 'user'; kind: 'text'; text: string }
  | { id: 'a2'; role: 'ai'; kind: 'image'; status: 'generating' | 'done' };

type CursorStage = 'hidden' | 'to-pill' | 'click-pill' | 'to-item' | 'hover-item' | 'click-item';

type AnimState = {
  loopKey: number;
  mode: 'chat' | 'image';
  zoomed: boolean;
  menuOpen: boolean;
  hoveredTool: 'image' | null;
  selectedMenuTool: 'image' | null;
  pillRipple: boolean;
  cursor: CursorStage;
  typedText: string;
  isTyping: boolean;
  pressingSend: boolean;
  fading: boolean;
  messages: ChatMessage[];
};

const PROMPT_CHAT = "Summarize Bayes' theorem";
const REPLY_CHAT = 'Start with your prior odds, then update them with new evidence.';
const PROMPT_IMAGE = "Chart of Bayes' theorem";

const INITIAL_STATE: AnimState = {
  loopKey: 0,
  mode: 'chat',
  zoomed: false,
  menuOpen: false,
  hoveredTool: null,
  selectedMenuTool: null,
  pillRipple: false,
  cursor: 'hidden',
  typedText: '',
  isTyping: false,
  pressingSend: false,
  fading: false,
  messages: [],
};

const STATIC_REDUCED_STATE: AnimState = {
  loopKey: -1,
  mode: 'image',
  zoomed: false,
  menuOpen: false,
  hoveredTool: null,
  selectedMenuTool: 'image',
  pillRipple: false,
  cursor: 'hidden',
  typedText: '',
  isTyping: false,
  pressingSend: false,
  fading: false,
  messages: [
    { id: 'u1', role: 'user', kind: 'text', text: PROMPT_CHAT },
    { id: 'a1', role: 'ai', kind: 'text', status: 'done', text: REPLY_CHAT },
    { id: 'u2', role: 'user', kind: 'text', text: PROMPT_IMAGE },
    { id: 'a2', role: 'ai', kind: 'image', status: 'done' },
  ],
};

const TOOL_ITEMS: ReadonlyArray<{ id: 'image' | 'reasoning'; name: string }> = [
  { id: 'image', name: 'Generate Image' },
  { id: 'reasoning', name: 'Reasoning' },
];

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServerSnapshot = () => false;

// Clean Prior vs Posterior probability distribution chart illustrating Bayes' theorem.
const GeneratedBayesChart = () => (
  <svg
    viewBox="0 0 180 120"
    className="block h-full w-full text-slate-600 dark:text-slate-300"
  >
    <defs>
      <linearGradient id="bento-bayes-post" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="bento-bayes-prior" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
      </linearGradient>
    </defs>

    {/* Subtle horizontal gridlines */}
    <line x1="16" y1="32" x2="168" y2="32" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.75" />
    <line x1="16" y1="60" x2="168" y2="60" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.75" />
    <line x1="16" y1="88" x2="168" y2="88" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.75" />

    {/* Axes */}
    <path d="M16 18 V102 H168" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />

    {/* Prior distribution (wider, lower cyan curve) */}
    <path
      d="M20 102 C36 102, 46 60, 66 60 C86 60, 96 102, 118 102 Z"
      fill="url(#bento-bayes-prior)"
    />
    <path
      d="M20 102 C36 102, 46 60, 66 60 C86 60, 96 102, 118 102"
      fill="none"
      stroke="#0ea5e9"
      strokeWidth="1.75"
      strokeDasharray="3 2.5"
      strokeLinecap="round"
    />

    {/* Posterior distribution (taller, narrower shifted indigo/violet curve) */}
    <path
      d="M66 102 C88 102, 100 28, 120 28 C140 28, 148 102, 164 102 Z"
      fill="url(#bento-bayes-post)"
    />
    <path
      d="M66 102 C88 102, 100 28, 120 28 C140 28, 148 102, 164 102"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Bayesian update arrow from Prior peak toward Posterior peak */}
    <path
      d="M72 51 Q94 40 109 42"
      fill="none"
      stroke="#ec4899"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path d="M106 39 L111 42.3 L106.5 45.2" fill="none" stroke="#ec4899" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

    {/* Compact legend */}
    <g transform="translate(22, 12)">
      <circle cx="3" cy="4" r="2.5" fill="#0ea5e9" />
      <text x="8.5" y="6.8" fontSize="7.5" fontWeight="500" fill="currentColor" opacity="0.85">
        Prior
      </text>
      <circle cx="38" cy="4" r="2.5" fill="#6366f1" />
      <text x="43.5" y="6.8" fontSize="7.5" fontWeight="500" fill="currentColor" opacity="0.85">
        Posterior
      </text>
    </g>
  </svg>
);

// Arrow pointer SVG with light outline so it reads sharply in light and dark mode.
const PointerCursor = ({ stage }: { stage: CursorStage }) => {
  const isVisible = stage !== 'hidden';
  const isPressed = stage === 'click-pill' || stage === 'click-item';
  const onItem = stage === 'to-item' || stage === 'hover-item' || stage === 'click-item';

  const posTransform = !isVisible
    ? 'translate3d(96px, 30px, 0)'
    : onItem
      ? 'translate3d(62px, -60px, 0)'
      : 'translate3d(14px, 14px, 0)';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 z-40 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: `${posTransform} scale(${isPressed ? 0.86 : 1})`,
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
};

// Animates height from 0fr to 1fr on mount so each new bubble smoothly pushes earlier ones up.
const MessageSlot = ({ immediate, children }: { immediate: boolean; children: ReactNode }) => {
  const [open, setOpen] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [immediate]);

  return (
    <div className="bento-chat-slot" data-open={open ? 'true' : 'false'}>
      <div className="-mx-3 -mb-3 min-h-0 overflow-hidden px-3 pb-3 pt-1">{children}</div>
    </div>
  );
};

const ChatTile = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [state, setState] = useState<AnimState>(INITIAL_STATE);
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
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const later = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    if (!isInView || reducedMotion) {
      if (!isInView && !reducedMotion) {
        later(0, () => setState(INITIAL_STATE));
      }
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const startCycle = (nextLoop: number) => {
      if (cancelled) return;
      setState({ ...INITIAL_STATE, loopKey: nextLoop });

      // 1. Typewriter-type chat prompt
      const chatStepMs = 36;
      const chatStart = 300;
      for (let i = 1; i <= PROMPT_CHAT.length; i += 1) {
        later(chatStart + (i - 1) * chatStepMs, () => {
          setState((prev) => ({
            ...prev,
            typedText: PROMPT_CHAT.slice(0, i),
            isTyping: i < PROMPT_CHAT.length,
          }));
        });
      }

      const chatEnd = chatStart + (PROMPT_CHAT.length - 1) * chatStepMs;

      // 2. Tap send and pop user message in
      later(chatEnd + 160, () => {
        setState((prev) => ({ ...prev, pressingSend: true }));
      });
      later(chatEnd + 280, () => {
        setState((prev) => ({
          ...prev,
          typedText: '',
          isTyping: false,
          pressingSend: false,
          messages: [{ id: 'u1', role: 'user', kind: 'text', text: PROMPT_CHAT }],
        }));
      });

      // 3. AI typing indicator (~1.2s)
      const aiTypingAt = chatEnd + 500;
      later(aiTypingAt, () => {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            { id: 'a1', role: 'ai', kind: 'text', status: 'typing', text: REPLY_CHAT },
          ],
        }));
      });

      // 4. AI text reply
      const aiDoneAt = aiTypingAt + 1200;
      later(aiDoneAt, () => {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === 'a1' && m.kind === 'text' ? { ...m, status: 'done' } : m,
          ),
        }));
      });

      // 5. Zoom in toward tools pill + glide cursor to it
      const zoomInAt = aiDoneAt + 850;
      later(zoomInAt, () => {
        setState((prev) => ({ ...prev, zoomed: true, cursor: 'to-pill' }));
      });

      // 6. Click tools pill -> ripple + open ToolsMenu dropdown above pill
      const clickPillAt = zoomInAt + 600;
      later(clickPillAt, () => {
        setState((prev) => ({
          ...prev,
          cursor: 'click-pill',
          pillRipple: true,
          menuOpen: true,
        }));
      });

      // 7. Move cursor up to "Generate Image" row
      const moveToItemAt = clickPillAt + 280;
      later(moveToItemAt, () => {
        setState((prev) => ({
          ...prev,
          cursor: 'to-item',
          pillRipple: false,
        }));
      });

      // 8. Hover "Generate Image"
      const hoverItemAt = moveToItemAt + 480;
      later(hoverItemAt, () => {
        setState((prev) => ({
          ...prev,
          cursor: 'hover-item',
          hoveredTool: 'image',
        }));
      });

      // 9. Click "Generate Image"
      const clickItemAt = hoverItemAt + 340;
      later(clickItemAt, () => {
        setState((prev) => ({
          ...prev,
          cursor: 'click-item',
          selectedMenuTool: 'image',
        }));
      });

      // 10. Close dropdown, switch pill to Image chip, fade cursor out, zoom back to 1
      const modeSelectedAt = clickItemAt + 240;
      later(modeSelectedAt, () => {
        setState((prev) => ({
          ...prev,
          menuOpen: false,
          hoveredTool: null,
          mode: 'image',
          cursor: 'hidden',
          zoomed: false,
        }));
      });

      // 11. Typewriter-type Bayes chart prompt after zoom settles
      const imgStart = modeSelectedAt + 580;
      const imgStepMs = 38;
      for (let i = 1; i <= PROMPT_IMAGE.length; i += 1) {
        later(imgStart + (i - 1) * imgStepMs, () => {
          setState((prev) => ({
            ...prev,
            typedText: PROMPT_IMAGE.slice(0, i),
            isTyping: i < PROMPT_IMAGE.length,
          }));
        });
      }

      const imgEnd = imgStart + (PROMPT_IMAGE.length - 1) * imgStepMs;

      // 12. Send chart prompt — user bubble pushes earlier messages up
      later(imgEnd + 160, () => {
        setState((prev) => ({ ...prev, pressingSend: true }));
      });
      later(imgEnd + 280, () => {
        setState((prev) => ({
          ...prev,
          typedText: '',
          isTyping: false,
          pressingSend: false,
          messages: [...prev.messages, { id: 'u2', role: 'user', kind: 'text', text: PROMPT_IMAGE }],
        }));
      });

      // 13. AI generating state
      const imgGenAt = imgEnd + 520;
      later(imgGenAt, () => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, { id: 'a2', role: 'ai', kind: 'image', status: 'generating' }],
        }));
      });

      // 14. Generated Bayes chart arrives
      const imgDoneAt = imgGenAt + 1220;
      later(imgDoneAt, () => {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === 'a2' && m.kind === 'image' ? { ...m, status: 'done' } : m,
          ),
        }));
      });

      // 15. Hold, fade out, and loop (~13.5s total)
      const fadeAt = imgDoneAt + 3300;
      later(fadeAt, () => {
        setState((prev) => ({ ...prev, fading: true, mode: 'chat', selectedMenuTool: null }));
      });
      later(fadeAt + 450, () => {
        startCycle(nextLoop + 1);
      });
    };

    startCycle(1);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isInView, reducedMotion]);

  const view = reducedMotion ? STATIC_REDUCED_STATE : state;
  const hasInput = view.typedText.length > 0;

  return (
    <BentoTile
      title="Chat and generate with any AI model"
      href="/pages/home"
      linkLabel="Open Omni to chat and generate images"
      className="min-h-[340px] sm:min-h-[360px] md:col-span-2 lg:col-span-8 lg:min-h-[400px]"
      art={<Swoosh id="bento-sw-a" side="a" />}
    >
      <p className="sr-only">
        Chat with GPT, Claude or DeepSeek from one input, and generate images from a text prompt.
      </p>

      {/* Outer unscaled stage observed for in-view gating */}
      <div ref={stageRef} aria-hidden="true" className="relative z-10 h-[340px] sm:h-[360px] lg:h-[400px]">
        {/* Inner zoomable stage (clipped by BentoTile's rounded overflow-hidden wrapper) */}
        <div
          data-zoomed={view.zoomed ? 'true' : 'false'}
          className={`flex h-full flex-col justify-end px-4 pb-3.5 pt-[54px] transition-transform duration-500 ease-in-out origin-[16%_88%] sm:px-6 sm:pb-4 sm:pt-[56px] lg:px-8 lg:pb-4 lg:pt-[58px] ${
            view.zoomed ? 'scale-[1.16]' : 'scale-100'
          }`}
        >
          <div className="mx-auto flex min-h-0 w-full max-w-[700px] flex-1 flex-col justify-end gap-2">
            {/* Message thread: bottom-anchored with deep top fade mask so clipped older turns leave no sliver */}
            <div
              className={`relative min-h-0 flex-1 overflow-hidden transition-opacity duration-300 [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_12%,#000_32%,#000_100%)] ${
                view.fading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="flex h-full flex-col justify-end">
                {view.messages.map((msg) => (
                  <MessageSlot key={`${view.loopKey}-${msg.id}`} immediate={reducedMotion}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bento-chat-pop max-w-[82%] rounded-[18px] rounded-br-[5px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-3 py-1.5 text-[11.5px] font-medium leading-snug text-white shadow-[0_6px_16px_rgba(99,102,241,0.26)] ring-1 ring-inset ring-white/20 sm:max-w-[76%] sm:text-xs lg:rounded-[20px] lg:rounded-br-[6px] lg:px-3.5 lg:py-2 lg:text-[13px] dark:from-indigo-500 dark:to-violet-600 dark:shadow-[0_6px_18px_rgba(15,23,42,0.45)]">
                          {msg.text}
                        </div>
                      </div>
                    ) : msg.kind === 'text' ? (
                      <div className="flex justify-start">
                        <div
                          className={`bento-chat-pop max-w-[86%] overflow-hidden rounded-[18px] rounded-bl-[5px] border border-[#e6e2ec] bg-white/95 px-3 py-1.5 text-[11.5px] leading-snug text-slate-800 shadow-[0_6px_16px_rgba(90,60,140,0.10)] transition-[max-height] duration-300 ease-out sm:max-w-[78%] sm:text-xs lg:rounded-[20px] lg:rounded-bl-[6px] lg:px-3.5 lg:py-2 lg:text-[13px] dark:border-white/10 dark:bg-[#243045] dark:text-slate-100 dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)] ${
                            msg.status === 'typing' ? 'max-h-10' : 'max-h-40'
                          }`}
                        >
                          {msg.status === 'typing' ? (
                            <span className="flex h-4 items-center gap-1 px-0.5 lg:h-[18px]">
                              <span
                                className="bento-chat-dot h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-300"
                                style={{ animationDelay: '0ms' }}
                              />
                              <span
                                className="bento-chat-dot h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-300"
                                style={{ animationDelay: '160ms' }}
                              />
                              <span
                                className="bento-chat-dot h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-300"
                                style={{ animationDelay: '320ms' }}
                              />
                            </span>
                          ) : (
                            <span className="bento-chat-reveal block">{msg.text}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div
                          data-gen-status={msg.status}
                          className="bento-chat-pop rounded-[18px] rounded-bl-[5px] border border-[#e6e2ec] bg-white/95 p-1.5 shadow-[0_6px_16px_rgba(90,60,140,0.10)] lg:rounded-[20px] lg:rounded-bl-[6px] lg:p-1.5 dark:border-white/10 dark:bg-[#243045] dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)]"
                        >
                          <div className="relative aspect-[3/2] w-[144px] overflow-hidden rounded-[12px] border border-slate-200/70 bg-slate-50/90 sm:w-[162px] lg:w-[174px] lg:rounded-[14px] dark:border-white/10 dark:bg-slate-900/70">
                            <div
                              className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 transition-opacity duration-300 dark:from-indigo-950/60 dark:via-slate-800 dark:to-violet-950/60 ${
                                msg.status === 'done' ? 'opacity-0' : 'opacity-100'
                              }`}
                            >
                              <div className="bento-chat-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />
                              <Sparkles className="relative h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                              <span className="relative text-[10px] font-medium text-indigo-600 lg:text-[11px] dark:text-indigo-200">
                                Generating...
                              </span>
                            </div>
                            <div
                              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                                msg.status === 'done' ? 'opacity-100' : 'opacity-0'
                              }`}
                            >
                              <GeneratedBayesChart />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </MessageSlot>
                ))}
              </div>
            </div>

            {/* Mirrors the real ChatComposer, spanning the bottom of the tile */}
            <div
              data-composer-mode={view.mode}
              className={`${CARD} relative shrink-0 p-2 transition-colors duration-200 lg:rounded-xl lg:p-2.5 ${
                view.mode === 'image' ? 'border-indigo-300/90 dark:border-indigo-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate pl-1 text-[11.5px] sm:text-xs lg:text-[14px]">
                  {hasInput ? (
                    <span className="text-slate-900 dark:text-slate-100">
                      {view.typedText}
                      {view.isTyping && (
                        <span className="bento-chat-caret ml-[1px] inline-block h-[13px] w-[1.5px] translate-y-[2px] bg-indigo-500 lg:h-[15px] dark:bg-indigo-300" />
                      )}
                    </span>
                  ) : (
                    <span className={MUTED}>
                      {view.mode === 'image'
                        ? 'Describe an image to generate...'
                        : 'Type your message...'}
                    </span>
                  )}
                </div>
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-200 lg:h-8 lg:w-8 ${
                    hasInput
                      ? 'bg-black text-white shadow-sm dark:bg-white dark:text-black'
                      : 'bg-gray-300 text-gray-500 dark:bg-slate-600 dark:text-gray-400'
                  } ${view.pressingSend ? 'scale-90' : 'scale-100'}`}
                >
                  <AiOutlineSend className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-2 lg:mt-2">
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <CiSquarePlus className="h-6 w-6 text-gray-500 lg:h-7 lg:w-7 dark:text-gray-400" />

                  {/* Tools pill + ToolsMenu dropdown + animated cursor */}
                  <div className="relative flex items-center">
                    <span
                      className={`relative inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10.5px] font-medium transition-all duration-200 lg:gap-1.5 lg:rounded-xl lg:px-2 lg:py-1 lg:text-xs ${
                        view.mode === 'image'
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-200'
                          : 'border-slate-200 bg-slate-50 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200'
                      } ${view.cursor === 'click-pill' ? 'scale-95' : 'scale-100'}`}
                    >
                      {view.pillRipple && (
                        <span className="bento-click-ring pointer-events-none absolute inset-0 rounded-lg border-2 border-indigo-400 lg:rounded-xl" />
                      )}
                      {view.mode === 'image' ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                          <span>Image</span>
                        </>
                      ) : (
                        <svg className="h-4 w-4 lg:h-5 lg:w-5" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z" />
                        </svg>
                      )}
                    </span>

                    {/* Mirrors app/components/chat/components/ToolsMenu.tsx */}
                    {view.menuOpen && (
                      <div
                        data-tools-menu="open"
                        className="bento-menu-pop absolute bottom-full left-0 z-30 mb-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg sm:w-48 dark:border-slate-700 dark:bg-slate-800"
                      >
                        {TOOL_ITEMS.map((tool) => {
                          const isHovered = view.hoveredTool === tool.id;
                          const isSelected = view.selectedMenuTool === tool.id;
                          return (
                            <div
                              key={tool.id}
                              data-tool-hover={isHovered ? 'true' : 'false'}
                              className={`flex h-8 items-center justify-between px-3 text-left transition-colors duration-150 ${
                                isHovered ? 'bg-slate-100 dark:bg-slate-700' : ''
                              }`}
                            >
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {tool.name}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <PointerCursor stage={view.cursor} />
                  </div>

                  <VscMic className="mx-1 h-4 w-4 text-gray-700 lg:h-5 lg:w-5 dark:text-gray-300" />
                </div>

                <div className="flex w-[100px] items-center justify-between rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 lg:w-[148px] lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-200">
                  <span className="flex items-center gap-1.5 lg:gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 lg:h-2 lg:w-2" />
                    GPT
                  </span>
                  <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoTile>
  );
};

export default ChatTile;