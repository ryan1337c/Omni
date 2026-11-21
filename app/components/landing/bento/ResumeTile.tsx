'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import BentoTile from './BentoTile';
import Swoosh from './Swoosh';
import { CARD_SURFACE } from './styles';

const BAR = 'h-1 rounded bg-slate-200 lg:h-1.5 dark:bg-white/10';
const HEAD = 'mt-2.5 text-[7px] font-semibold uppercase tracking-wider text-slate-400 lg:mt-3.5 lg:text-[9px]';

const FINAL_SCORE = 87;
const IDLE_MS = 140;
const HL_VARS = ['--resume-h0', '--resume-h1', '--resume-h2'] as const;
const SWAP_VARS = ['--resume-s0', '--resume-s1', '--resume-s2'] as const;
const SWAP_CLASS = ['bento-resume-s0', 'bento-resume-s1', 'bento-resume-s2'] as const;

// Each phrase owns a highlight-sweep phase, then a top-down word-swap phase.
const SWAPS = [
  { from: 'a web dashboard', to: 'React dashboard', hlStart: 0.08, hlEnd: 0.28, swapStart: 0.28, swapEnd: 0.46 },
  { from: 'Improved API speed', to: 'Cut API latency by 40%', hlStart: 0.40, hlEnd: 0.54, swapStart: 0.54, swapEnd: 0.74 },
  { from: 'JavaScript,', to: 'TypeScript,', hlStart: 0.66, hlEnd: 0.80, swapStart: 0.80, swapEnd: 0.96 },
] as const;

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServerSnapshot = () => false;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const phaseT = (progress: number, start: number, end: number) =>
  clamp01((progress - start) / (end - start));

const snapTarget = (value: number, dir: 1 | -1): 0 | 1 => {
  if (value === 0.5) return dir === 1 ? 1 : 0;
  return value >= 0.5 ? 1 : 0;
};

const HighlightSwap = ({ index, from, to }: { index: 0 | 1 | 2; from: string; to: string }) => {
  const sizer = to.length >= from.length ? to : from;
  return (
    <span className={`bento-resume-swap ${SWAP_CLASS[index]}`}>
      <span className="bento-resume-sizer">{sizer}</span>
      <span className="bento-resume-hl" />
      <span className="bento-resume-from">{from}</span>
      <span className="bento-resume-to">{to}</span>
    </span>
  );
};

const ResumeTile = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    getReducedServerSnapshot,
  );

  useEffect(() => {
    const root = rootRef.current;
    const block = blockRef.current;
    const scoreEl = scoreRef.current;
    if (!root || !block || !scoreEl) return;

    let raf = 0;
    let idleTimer = 0;
    let snapTimer = 0;
    let lastProgress = 0;
    let direction: 1 | -1 = 1;
    const hlLatches: Array<0 | 1 | null> = [null, null, null];
    const swapLatches: Array<0 | 1 | null> = [null, null, null];

    const applyScore = (progress: number) => {
      root.style.setProperty('--resume-score', String(progress * FINAL_SCORE));
      scoreEl.textContent = `${Math.round(progress * FINAL_SCORE)}%`;
    };

    const applyPhases = (hlValues: number[], swapValues: number[]) => {
      hlValues.forEach((value, i) => {
        root.style.setProperty(HL_VARS[i], String(value));
      });
      swapValues.forEach((value, i) => {
        root.style.setProperty(SWAP_VARS[i], String(value));
      });
    };

    const rawHl = (progress: number) => SWAPS.map((swap) => phaseT(progress, swap.hlStart, swap.hlEnd));
    const rawSwap = (progress: number) =>
      SWAPS.map((swap) => phaseT(progress, swap.swapStart, swap.swapEnd));

    const displayed = (values: number[], latches: Array<0 | 1 | null>) =>
      values.map((value, i) => {
        const latch = latches[i];
        return latch === null ? value : latch;
      });

    const stopSnapping = () => {
      if (snapTimer) {
        window.clearTimeout(snapTimer);
        snapTimer = 0;
      }
      root.dataset.snapping = 'false';
    };

    const armSnapClear = () => {
      if (snapTimer) window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        snapTimer = 0;
        root.dataset.snapping = 'false';
      }, 420);
    };

    const applyProgress = (progress: number) => {
      applyScore(progress);
      applyPhases(displayed(rawHl(progress), hlLatches), displayed(rawSwap(progress), swapLatches));
    };

    // Progress is driven by the Experience + Skills block, not the tile frame, so it
    // adapts to layout and viewport size. Starts once the block's top is just visible
    // and finishes when its bottom sits comfortably in view, with a minimum travel.
    const measure = () => {
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      const startY = vh - 20;
      const preferredEndTop = vh * 0.82 - rect.height;
      const minTravel = vh * 0.28;
      const endTopY = startY - preferredEndTop < minTravel ? startY - minTravel : preferredEndTop;
      const travel = startY - endTopY;
      if (travel <= 0) return rect.top < startY ? 1 : 0;
      return clamp01((startY - rect.top) / travel);
    };

    const snapPhase = (values: number[], latches: Array<0 | 1 | null>, dir: 1 | -1) => {
      let needsSnap = false;
      const next = values.map((value, i) => {
        if (value <= 0 || value >= 1) {
          latches[i] = null;
          return value;
        }
        const target = snapTarget(value, dir);
        latches[i] = target;
        needsSnap = true;
        return target;
      });
      return { next, needsSnap };
    };

    const snapIdle = (progress: number, dir: 1 | -1) => {
      const hl = snapPhase(rawHl(progress), hlLatches, dir);
      const swap = snapPhase(rawSwap(progress), swapLatches, dir);
      if (!hl.needsSnap && !swap.needsSnap) return;
      root.dataset.snapping = 'true';
      applyPhases(hl.next, swap.next);
      armSnapClear();
    };

    const releaseLatches = (values: number[], latches: Array<0 | 1 | null>) => {
      values.forEach((value, i) => {
        const latch = latches[i];
        if (latch === 1 && value < 0.45) latches[i] = null;
        if (latch === 0 && value > 0.55) latches[i] = null;
      });
    };

    const tick = () => {
      raf = 0;
      const progress = measure();
      if (Math.abs(progress - lastProgress) < 1e-4) return;
      if (progress > lastProgress) direction = 1;
      else if (progress < lastProgress) direction = -1;
      lastProgress = progress;
      stopSnapping();
      releaseLatches(rawHl(progress), hlLatches);
      releaseLatches(rawSwap(progress), swapLatches);
      applyProgress(progress);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleTimer = 0;
        snapIdle(lastProgress, direction);
      }, IDLE_MS);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      applyScore(1);
      applyPhases([1, 1, 1], [1, 1, 1]);
      return;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    tick();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.clearTimeout(snapTimer);
    };
  }, [reducedMotion]);

  return (
    <BentoTile
      title="Tailor your resume"
      href="/pages/home"
      linkLabel="Open Omni to tailor your resume"
      className="min-h-[340px] md:min-h-[370px] lg:col-span-4 lg:min-h-[400px]"
      art={<Swoosh id="bento-sw-b" side="b" />}
    >
      <p className="sr-only">
        Paste a job description and Omni tailors your resume to it, with an ATS-style match score.
      </p>

      <div ref={rootRef} className="bento-resume relative z-10 px-4 pt-14 md:pt-16 lg:pt-[76px]">
        <div aria-hidden="true" className="relative mx-auto w-[170px] -translate-x-4 md:w-[180px] lg:w-[228px] lg:-translate-x-6">
          {/* Paper-style resume; phrases start plain, then highlight, then swap to a tailored wording */}
          <div className={`${CARD_SURFACE} h-[226px] overflow-hidden rounded-sm p-3 text-[8px] leading-[11px] text-slate-600 md:h-[238px] md:text-[8.5px] md:leading-[11.5px] lg:h-[304px] lg:p-4 lg:text-[10.5px] lg:leading-[14px] dark:text-slate-300`}>
            <p className="text-[10px] font-semibold leading-3 text-slate-700 lg:text-[13px] lg:leading-4 dark:text-slate-100">Alex Morgan</p>
            <p className="text-slate-400">Software Engineer</p>

            <div ref={blockRef}>
              <p className={HEAD}>Experience</p>
              <ul className="mt-1 list-disc space-y-1 pl-3 lg:mt-1.5 lg:space-y-1.5 lg:pl-3.5">
                <li>
                  Built <HighlightSwap index={0} from={SWAPS[0].from} to={SWAPS[0].to} /> for 2k+ users
                </li>
                <li>
                  <HighlightSwap index={1} from={SWAPS[1].from} to={SWAPS[1].to} />
                  <span className="block">with caching</span>
                </li>
                <li>Led a team of 4</li>
              </ul>

              <p className={HEAD}>Skills</p>
              <ul className="mt-1 list-disc space-y-1 pl-3 lg:mt-1.5 lg:space-y-1.5 lg:pl-3.5">
                <li>
                  <HighlightSwap index={2} from={SWAPS[2].from} to={SWAPS[2].to} /> Node, SQL
                </li>
                <li>Docker, CI/CD, testing</li>
              </ul>
            </div>

            <p className={HEAD}>Education</p>
            <div className={`${BAR} mt-1.5 w-[85%] lg:mt-2`} />
            <div className={`${BAR} mt-1.5 w-[60%] lg:mt-2`} />
          </div>

          {/* Match ring, overlapping the paper's right edge. Score and arc start at 0 and scrub with scroll. */}
          <div className="absolute -right-10 top-[44%] grid h-[74px] w-[74px] place-items-center rounded-full bg-white shadow-[0_6px_16px_rgba(90,60,140,0.18)] lg:-right-[52px] lg:h-24 lg:w-24 dark:bg-[#243045] dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)]">
            <svg viewBox="0 0 74 74" className="absolute inset-0 h-full w-full -rotate-90">
              <defs>
                <linearGradient id="bento-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" className="bento-ring-a" />
                  <stop offset="1" className="bento-ring-b" />
                </linearGradient>
              </defs>
              <circle cx="37" cy="37" r="30" fill="none" strokeWidth="5" className="stroke-pink-100 dark:stroke-white/10" />
              <circle
                cx="37"
                cy="37"
                r="30"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                stroke="url(#bento-ring)"
                pathLength={100}
                className="bento-resume-ring"
              />
            </svg>
            <div className="relative text-center leading-none">
              <p ref={scoreRef} className="text-[15px] font-bold text-slate-800 lg:text-xl dark:text-slate-100">
                0%
              </p>
              <p className="mt-0.5 text-[9px] text-slate-500 lg:mt-1 lg:text-xs dark:text-slate-400">match</p>
            </div>
          </div>
        </div>
      </div>
    </BentoTile>
  );
};

export default ResumeTile;