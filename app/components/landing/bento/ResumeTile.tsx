import BentoTile from './BentoTile';
import Swoosh from './Swoosh';
import { CARD_SURFACE } from './styles';

const MARK = 'rounded-sm bg-pink-200/80 px-0.5 text-pink-900 dark:bg-indigo-400/25 dark:text-indigo-100';
const BAR = 'h-1 rounded bg-slate-200 lg:h-1.5 dark:bg-white/10';
const HEAD = 'mt-2.5 text-[7px] font-semibold uppercase tracking-wider text-slate-400 lg:mt-3.5 lg:text-[9px]';

const ResumeTile = () => (
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

    <div aria-hidden="true" className="relative z-10 px-4 pt-14 md:pt-16 lg:pt-[76px]">
      <div className="relative mx-auto w-[170px] -translate-x-4 md:w-[180px] lg:w-[228px] lg:-translate-x-6">
        {/* Paper-style resume with a few lines picked out in pink */}
        <div className={`${CARD_SURFACE} h-[226px] overflow-hidden rounded-sm p-3 text-[8px] leading-[11px] text-slate-600 md:h-[238px] md:text-[8.5px] md:leading-[11.5px] lg:h-[304px] lg:p-4 lg:text-[10.5px] lg:leading-[14px] dark:text-slate-300`}>
          <p className="text-[10px] font-semibold leading-3 text-slate-700 lg:text-[13px] lg:leading-4 dark:text-slate-100">Alex Morgan</p>
          <p className="text-slate-400">Software Engineer</p>

          <p className={HEAD}>Experience</p>
          <ul className="mt-1 list-disc space-y-1 pl-3 lg:mt-1.5 lg:space-y-1.5 lg:pl-3.5">
            <li>
              Built a <span className={MARK}>React dashboard</span> for 2k+ users
            </li>
            <li>
              <span className={MARK}>Cut API latency by 40%</span> with caching
            </li>
            <li>Led a team of 4 on weekly releases</li>
          </ul>

          <p className={HEAD}>Skills</p>
          <ul className="mt-1 list-disc space-y-1 pl-3 lg:mt-1.5 lg:space-y-1.5 lg:pl-3.5">
            <li>
              <span className={MARK}>TypeScript</span>, Node, SQL
            </li>
            <li>Docker, CI/CD, testing</li>
          </ul>

          <p className={HEAD}>Education</p>
          <div className={`${BAR} mt-1.5 w-[85%] lg:mt-2`} />
          <div className={`${BAR} mt-1.5 w-[60%] lg:mt-2`} />
        </div>

        {/* 87% match ring, overlapping the paper's right edge */}
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
              strokeDasharray="164 189"
            />
          </svg>
          <div className="relative text-center leading-none">
            <p className="text-[15px] font-bold text-slate-800 lg:text-xl dark:text-slate-100">87%</p>
            <p className="mt-0.5 text-[9px] text-slate-500 lg:mt-1 lg:text-xs dark:text-slate-400">match</p>
          </div>
        </div>
      </div>
    </div>
  </BentoTile>
);

export default ResumeTile;
