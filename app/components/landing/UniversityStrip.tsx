import Image from 'next/image';
import PencilUnderline from './PencilUnderline';

type University = { name: string; src?: string; width?: number; height: number };

// Logo files live in public/universities, exported at 96px tall.
// `height` is the on-screen height, tuned per logo so they look optically even.
const UNIVERSITIES: University[] = [
  { name: 'University of Toronto', src: '/universities/uoft.png', width: 402, height: 36 },
  { name: 'University of British Columbia', src: '/universities/ubc.png', width: 457, height: 40 },
  { name: 'McGill University', src: '/universities/mcgill.png', width: 411, height: 28 },
  { name: 'McMaster University', src: '/universities/mcmaster.png', width: 260, height: 42 },
  { name: 'University of Waterloo', src: '/universities/waterloo.png', width: 450, height: 30 },
  { name: 'York University', src: '/universities/york.png', width: 307, height: 42 },
  { name: 'University of Ottawa', src: '/universities/uottawa.png', width: 494, height: 30 },
  { name: 'Western University', height: 40 },
  { name: "Queen's University", src: '/universities/queens.png', width: 332, height: 36 },
  { name: 'Université de Montréal', src: '/universities/udem.png', width: 896, height: 22 },
];

const LogoItem = ({ uni, hidden }: { uni: University; hidden?: boolean }) => (
  <li
    aria-hidden={hidden}
    className="flex-none flex items-center justify-center h-12 px-6 sm:px-9 border-r border-slate-500/30 dark:border-white/15"
  >
    {uni.src && uni.width ? (
      <Image
        src={uni.src}
        alt={hidden ? '' : uni.name}
        width={uni.width}
        height={96}
        style={{ height: uni.height, width: 'auto' }}
        className="block dark:[filter:brightness(0)_invert(1)] dark:opacity-85"
      />
    ) : (
      // No official logo file yet: simple text wordmark
      <span className="font-serif leading-none text-left text-[#4f2683] dark:text-white dark:opacity-85">
        <span className="block text-2xl font-bold">Western</span>
        <span className="block text-[9px] tracking-[0.3em] mt-0.5">UNIVERSITY</span>
      </span>
    )}
  </li>
);

const UniversityStrip = () => (
  <section
    aria-label="Trusted by students from top universities"
    className="bg-landingPageLight dark:bg-slate-900/40 border-y border-black/5 dark:border-white/10 py-7 sm:py-9"
  >
    <div className="flex items-center gap-4 sm:gap-8 max-w-3xl mx-auto px-6">
      <span className="h-px flex-1 bg-slate-300 dark:bg-white/15" />
      <h2 className="text-sm sm:text-base font-medium italic text-center text-slate-600 dark:text-slate-300">
        Trusted by students from{' '}
        <PencilUnderline straight>Top Universities</PencilUnderline>
      </h2>
      <span className="h-px flex-1 bg-slate-300 dark:bg-white/15" />
    </div>

    <div className="uni-marquee uni-mask mt-6 sm:mt-7 overflow-hidden">
      {/* The list is rendered twice so the scroll loops seamlessly */}
      <ul className="uni-track">
        {UNIVERSITIES.map((uni) => <LogoItem key={uni.name} uni={uni} />)}
        {UNIVERSITIES.map((uni) => <LogoItem key={`${uni.name}-dup`} uni={uni} hidden />)}
      </ul>
    </div>
  </section>
);

export default UniversityStrip;