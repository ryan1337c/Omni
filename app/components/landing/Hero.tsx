"use client";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket } from '@fortawesome/free-solid-svg-icons';
import { BsChatDots, BsStickies, BsPatchQuestion, BsImage, BsFileText } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import { RainbowButton } from '@/components/ui/rainbow-button';
import icon from '@/public/omni-logo.png';

type OrbitItem = { label: string; icon: IconType; color: string };

// Feature chips that circle the logo, evenly spaced around the ring
const ORBIT_ITEMS: OrbitItem[] = [
  { label: 'Chat', icon: BsChatDots, color: 'text-indigo-500' },
  { label: 'Flashcards', icon: BsStickies, color: 'text-pink-500' },
  { label: 'Quizzes', icon: BsPatchQuestion, color: 'text-violet-500' },
  { label: 'Images', icon: BsImage, color: 'text-orange-500' },
  { label: 'Resume', icon: BsFileText, color: 'text-emerald-500' },
];
const ORBIT_RADIUS = 190;

const HeroOrb = () => (
  <div className="relative w-[540px] h-[470px] grid place-items-center" aria-hidden>
    <div className="absolute w-[430px] h-[430px] rounded-full blur-3xl bg-gradient-to-br from-[#ffb59e]/70 via-[#ff9bc3]/50 to-[#c6b4ff]/70 dark:from-fuchsia-500/20 dark:via-indigo-500/25 dark:to-violet-500/30" />
    <div className="absolute w-[380px] h-[380px] rounded-full border border-dashed border-violet-400/50 dark:border-white/20" />
    <div className="absolute w-[250px] h-[250px] rounded-full border border-violet-300/50 dark:border-white/10" />

    {/* Two small dots on the inner ring */}
    <div className="hero-orbit-rev absolute w-[250px] h-[250px]">
      <span className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/60" />
      <span className="absolute -bottom-1.5 left-1/2 w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/60" />
    </div>

    {/* Feature chips on the outer ring */}
    <div className="hero-orbit absolute left-1/2 top-1/2 w-0 h-0">
      {ORBIT_ITEMS.map(({ label, icon: Icon, color }, i) => {
        const angle = (360 / ORBIT_ITEMS.length) * i;
        return (
          <div
            key={label}
            className="absolute left-0 top-0 w-0 h-0"
            style={{ transform: `rotate(${angle}deg) translateY(-${ORBIT_RADIUS}px) rotate(-${angle}deg)` }}
          >
            <div className="hero-orbit-counter">
              <div
                title={label}
                className={`absolute -left-[30px] -top-[30px] w-[60px] h-[60px] rounded-2xl grid place-items-center bg-white ring-1 ring-black/5 shadow-xl shadow-violet-900/15 dark:bg-slate-800 dark:ring-white/15 dark:shadow-black/40 ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Center logo */}
    <div className="hero-orb-core relative w-[170px] h-[170px] rounded-full grid place-items-center bg-gradient-to-br from-[#fccdbe] via-[#ff9bc3] to-[#beacfe] shadow-[0_0_80px_20px_rgba(255,155,195,.55)] dark:from-indigo-400 dark:via-violet-500 dark:to-fuchsia-500 dark:shadow-[0_0_80px_20px_rgba(99,102,241,.5)]">
      <div className="absolute inset-3 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur" />
      <img src={icon.src} alt="" className="relative w-24 h-24 rounded-3xl shadow-xl" />
    </div>
  </div>
);

const Hero = ({ onWatchDemo }: { onWatchDemo?: () => void }) => {
  const router = useRouter();

  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden">

      <div className="relative max-w-6xl w-full mx-auto px-6 pt-28 md:pt-32 pb-10 lg:pb-20 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 gap-6 lg:gap-14 items-center">
        {/* Copy */}
        <div className="min-w-0 flex flex-col items-center text-center lg:items-start lg:text-left animate-fade-in">
          <h1
            className="text-[clamp(4.5rem,13vw,8rem)] font-semibold leading-none pb-2 tracking-[0.01em] -mr-[0.01em] lg:-ml-[0.025em] text-[#0f172a] dark:text-white"
          >
            Omni
          </h1>
          <p className="mt-4 sm:mt-5 text-xl sm:text-2xl font-light text-[#475569] dark:text-slate-400">
            Fast. Smart. <span className="text-[#6366f1] dark:text-[#818cf8]">Limitless.</span>
          </p>
          <p className="mt-5 sm:mt-6 text-[0.95rem] sm:text-base font-light leading-relaxed max-w-lg text-slate-600 dark:text-slate-300">
            Turn your notes, PDFs and lectures into flashcards, quizzes and answers — then tailor your resume to any job description and get an ATS-style keyword match score.
          </p>

          <div className="mt-8 sm:mt-10 mb-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
            <RainbowButton
              className="p-5 flex gap-2 items-center rounded-lg dark:bg-launch bg-landingPageLight"
              id="launch"
              onClick={() => router.push('/pages/home')}
              variant="outline"
              size="lg"
            >
              <FontAwesomeIcon icon={faRocket} id="rocket" />
              Launch App
            </RainbowButton>
            <button
              type="button"
              onClick={onWatchDemo}
              className="px-5 py-3 rounded-full text-base font-semibold text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Watch demo →
            </button>
          </div>
          <p className="mt-5 sm:mt-7 text-sm text-slate-500 dark:text-slate-400">
            Free to start · 20 credits every day
          </p>
        </div>

        {/* Orb: taken out of the layout flow (absolute) and scaled down on smaller screens, so its fixed 540px width never widens the column */}
        <div className="relative min-w-0 h-[300px] sm:h-[400px] lg:h-[470px] w-full">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.6] sm:scale-[0.85] lg:scale-100 origin-center">
            <HeroOrb />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;