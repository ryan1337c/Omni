'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

// Canvas with an elliptical belt of dots drifting inward (with a slight swirl) toward the
// centre, shrinking and fading out before they reach an invisible dead zone, then respawning
// on the belt.
//
// Cost control:
//  - the rAF loop only runs while the canvas is on screen AND the tab is visible
//  - frames are capped at ~30fps (the motion is slow)
//  - the backing store is scaled by devicePixelRatio, capped at 2
//  - with prefers-reduced-motion it draws one static frame and never starts the loop
//  - everything is torn down on unmount; all randomness is seeded inside the effect

const ANGLES = 96;
const PER_ANGLE = 7;
const MAX_DPR = 2;
const CYCLE_MS = 16000;
const FRAME_MS = 1000 / 30;
const BELT_ALPHA = 0.55;
const SWIRL = 0.6; // radians turned over one trip to the centre
const DEAD_RX = 46; // dead zone (CSS px) at the base tile height: wider than the icon + caption
const DEAD_RY = 36;
const BASE_H = 240; // tile height the sizes above were drawn for
const MAX_SCALE = 1.3; // the icon and caption grow with the tile, so the dead zone and dots do too

const LIGHT = ['#ec4899', '#d946ef', '#c084fc', '#f472b6'];
const DARK = ['#818cf8', '#6366f1', '#93c5fd'];

type Dot = { a: number; k: number; t: number; speed: number; color: number; size: number };

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const DotBelt = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) return;

    const palette = dark ? DARK : LIGHT;
    const rand = mulberry32(7);
    const dots: Dot[] = [];
    for (let i = 0; i < ANGLES; i++) {
      for (let j = 0; j < PER_ANGLE; j++) {
        dots.push({
          a: (i / ANGLES) * Math.PI * 2 + (rand() - 0.5) * 0.08,
          k: 1 + (rand() - 0.5) * 0.14, // belt thickness
          t: (j + rand() * 0.8) / PER_ANGLE,
          speed: 0.85 + rand() * 0.3,
          color: Math.floor(rand() * palette.length),
          size: 0.7 + rand() * 0.9,
        });
      }
    }

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const s = Math.min(MAX_SCALE, Math.max(1, h / BASE_H));
      const deadRx = DEAD_RX * s;
      const deadRy = DEAD_RY * s;
      const beltRx = w * 0.37;
      const beltRy = h * 0.3;
      for (const d of dots) {
        const e = Math.pow(d.t, 1.8); // ease-in: dots linger on the belt, then rush inward
        const rx = lerp(beltRx * d.k, deadRx, e);
        const ry = lerp(beltRy * d.k, deadRy, e);
        const angle = d.a + SWIRL * d.t;
        const fadeIn = Math.min(1, d.t / 0.05);
        const alpha = BELT_ALPHA * (1 - Math.pow(d.t, 4)) * fadeIn;
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = palette[d.color];
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry, d.size * s * lerp(1.5, 0.5, d.t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const step = (dtMs: number) => {
      for (const d of dots) {
        d.t += (dtMs / CYCLE_MS) * d.speed;
        if (d.t >= 1) d.t -= 1; // respawn on the belt
      }
    };

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = motion.matches;
    let visible = false;
    let running = false;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      if (dt < FRAME_MS) return;
      last = now;
      step(Math.min(dt, 100));
      draw();
    };
    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onMotion = () => {
      reduce = motion.matches;
      if (reduce) {
        stop();
        draw();
      } else {
        start();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: '80px' },
    );

    resize();
    draw(); // static first frame (and the only frame under reduced motion)
    resizeObserver.observe(wrap);
    intersection.observe(wrap);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
    };
  }, [dark]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default DotBelt;
