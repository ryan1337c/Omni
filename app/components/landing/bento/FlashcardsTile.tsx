'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import BentoTile from './BentoTile';
import { CARD, MUTED } from './styles';

const CARDS = [
  {
    subject: 'Stats',
    question: "What is Bayes' theorem?",
    answer: 'Update a prior with new evidence: P(H|E) ∝ P(E|H) P(H).',
  },
  {
    subject: 'Biology',
    question: 'What is the role of mitochondria?',
    answer: 'They produce ATP, the energy currency the cell runs on.',
  },
  {
    subject: 'Stats',
    question: 'What is a p-value?',
    answer: 'The probability of data at least this extreme if the null is true.',
  },
  {
    subject: 'Biology',
    question: 'What is natural selection?',
    answer: 'Traits that aid survival and reproduction become more common over generations.',
  },
] as const;

type Phase = 'front' | 'flip' | 'back' | 'swipe';
type AnimState = { index: number; phase: Phase };

const INITIAL_STATE: AnimState = { index: 0, phase: 'front' };
const CARD_COUNT = CARDS.length;

const FRONT_MS = 1400;
const FLIP_MS = 700;
const BACK_MS = 1500;
const SWIPE_MS = 750;

const PHASE_MS: Record<Phase, number> = {
  front: FRONT_MS,
  flip: FLIP_MS,
  back: BACK_MS,
  swipe: SWIPE_MS,
};

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServerSnapshot = () => false;

const advance = (state: AnimState): AnimState => {
  if (state.phase === 'front') return { index: state.index, phase: 'flip' };
  if (state.phase === 'flip') return { index: state.index, phase: 'back' };
  if (state.phase === 'back') return { index: state.index, phase: 'swipe' };
  return { index: (state.index + 1) % CARD_COUNT, phase: 'front' };
};

const progressStart = (index: number) => (index + 1) / CARD_COUNT;
const progressEnd = (index: number) =>
  index === CARD_COUNT - 1 ? 1 / CARD_COUNT : (index + 2) / CARD_COUNT;

const progressFor = (state: AnimState) => {
  if (state.phase === 'swipe') return progressEnd(state.index);
  return progressStart(state.index);
};

type FlashFace = (typeof CARDS)[number];

const FACE =
  `${CARD} flex h-full flex-col overflow-hidden px-4 py-3.5 lg:rounded-xl lg:px-6 lg:py-5`;
const SHELL = 'bento-flash-shell h-[168px] md:h-[176px] lg:h-[210px]';

const FlipChip = () => (
  <span className="bento-flash-flip-btn inline-flex items-center gap-1.5 rounded-lg border border-[#e6e2ec] px-3 py-1 text-[11px] text-indigo-500 lg:gap-2 lg:px-4 lg:py-1.5 lg:text-[13px] dark:border-white/10 dark:text-indigo-300">
    <RotateCw className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
    Flip
  </span>
);

const CardHeader = ({ subject, counter }: { subject: string; counter: number }) => (
  <div className="flex items-center justify-between">
    <span className="rounded-md bg-indigo-500 px-2 py-0.5 text-[11px] font-medium text-white lg:px-2.5 lg:py-1 lg:text-[13px]">
      {subject}
    </span>
    <span className={`text-[11px] lg:text-[13px] ${MUTED}`}>
      Card {counter + 1} of {CARD_COUNT}
    </span>
  </div>
);

const FrontBody = ({ card, counter }: { card: FlashFace; counter: number }) => (
  <>
    <CardHeader subject={card.subject} counter={counter} />
    <p className="mt-3 flex flex-1 items-center justify-center text-center text-[17px] font-semibold leading-snug text-[#111118] lg:mt-5 lg:text-2xl dark:text-slate-100">
      {card.question}
    </p>
    <div className="mt-3 flex justify-center lg:mt-5">
      <FlipChip />
    </div>
  </>
);

const AnswerBody = ({ card, counter }: { card: FlashFace; counter: number }) => (
  <>
    <CardHeader subject={card.subject} counter={counter} />
    <p className="mt-3 flex min-h-0 flex-1 items-center justify-center text-center text-[15px] font-medium leading-snug text-[#111118] lg:mt-5 lg:text-xl dark:text-slate-100">
      {card.answer}
    </p>
    <p className={`mt-3 text-center text-[11px] lg:mt-5 lg:text-[13px] ${MUTED}`}>Answer</p>
  </>
);

const FlatCard = ({ children }: { children: ReactNode }) => (
  <div className={FACE}>{children}</div>
);

// One rotating element (0->180). Faces are stacked on the front of that element
// and swap at 90deg. Answer content is pre-mirrored with scaleX(-1) so it reads
// correctly once the wrapper is at 180deg, without relying on preserve-3d.
const FlipCard = ({ card, counter }: { card: FlashFace; counter: number }) => (
  <div className="bento-flash-scene h-full">
    <div className="bento-flash-flipper">
      <div className="bento-flash-face bento-flash-face-front">
        <FlatCard>
          <FrontBody card={card} counter={counter} />
        </FlatCard>
      </div>
      <div className="bento-flash-face bento-flash-face-back">
        <div className="bento-flash-mirror">
          <FlatCard>
            <AnswerBody card={card} counter={counter} />
          </FlatCard>
        </div>
      </div>
    </div>
  </div>
);

const FlashcardsTile = () => {
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
    if (reducedMotion || !isInView) return;

    // Keep the leaving card mounted for the whole swipe; advance only after
    // the swipe animation finishes (animationend, with a matching timeout).
    if (state.phase === 'swipe') {
      const stage = stageRef.current;
      const layer = stage?.querySelector<HTMLElement>('.bento-flash-layer[data-role="current"]');
      if (!layer) return;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        setState((prev) => advance(prev));
      };
      const onEnd = (event: AnimationEvent) => {
        if (event.target !== layer) return;
        if (event.animationName !== 'bento-flash-swipe-move') return;
        finish();
      };
      layer.addEventListener('animationend', onEnd);
      const fallback = window.setTimeout(finish, SWIPE_MS + 80);
      return () => {
        layer.removeEventListener('animationend', onEnd);
        window.clearTimeout(fallback);
      };
    }

    const id = window.setTimeout(() => {
      setState((prev) => advance(prev));
    }, PHASE_MS[state.phase]);
    return () => window.clearTimeout(id);
  }, [isInView, reducedMotion, state.phase, state.index]);

  const view = reducedMotion ? INITIAL_STATE : state;
  const current = CARDS[view.index];
  const nextIndex = (view.index + 1) % CARD_COUNT;
  const next = CARDS[nextIndex];
  const showFlip = view.phase === 'front' || view.phase === 'flip' || view.phase === 'back';
  const progress = progressFor(view);
  const draining = view.phase === 'swipe' && view.index === CARD_COUNT - 1;

  return (
    <BentoTile
      title="Flashcards that flip"
      href="/pages/home"
      linkLabel="Open Omni to make flashcards"
      className="bento-dots bento-pin bento-pin-bl min-h-[270px] md:min-h-[370px] lg:col-span-5 lg:min-h-[340px]"
    >
      <p className="sr-only">Turn your notes into flashcards and flip through them to study.</p>

      <div
        ref={stageRef}
        aria-hidden="true"
        className="relative z-10 flex h-full items-center px-6 pb-5 pt-14 md:pt-16 lg:px-8 lg:pb-7 lg:pt-[68px]"
      >
        <div className="relative mx-auto w-full max-w-[290px] md:max-w-[310px] lg:max-w-[380px]">
          <div
            className="bento-flash-stage relative"
            data-flash-phase={view.phase}
            data-flash-index={String(view.index)}
            data-drain={draining ? 'true' : 'false'}
            style={{ '--flash-progress': String(progress) } as CSSProperties}
          >
            <div className="bento-flash-stack relative">
              <div
                className="bento-flash-layer"
                key={`n-${nextIndex}`}
                data-role="next"
                data-flash-index={String(nextIndex)}
              >
                <div className={SHELL}>
                  <FlatCard>
                    <FrontBody card={next} counter={nextIndex} />
                  </FlatCard>
                </div>
              </div>

              <div
                className="bento-flash-layer"
                key={`c-${view.index}`}
                data-role="current"
                data-flash-index={String(view.index)}
              >
                <div className={`${SHELL} relative`}>
                  {showFlip ? (
                    <FlipCard card={current} counter={view.index} />
                  ) : (
                    <FlatCard>
                      <AnswerBody card={current} counter={view.index} />
                    </FlatCard>
                  )}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-3 h-1.5 w-1/2 overflow-hidden rounded-full bg-indigo-100 lg:mt-5 lg:h-2 dark:bg-white/10">
              <div className="bento-flash-bar-fill h-full rounded-full bg-indigo-500" />
            </div>
          </div>
        </div>
      </div>
    </BentoTile>
  );
};

export default FlashcardsTile;
