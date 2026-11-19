import { RotateCw } from 'lucide-react';
import BentoTile from './BentoTile';
import { CARD, MUTED } from './styles';

const FlashcardsTile = () => (
  <BentoTile
    title="Flashcards that flip"
    href="/pages/home"
    linkLabel="Open Omni to make flashcards"
    className="bento-dots bento-pin bento-pin-bl min-h-[270px] md:min-h-[370px] lg:col-span-5 lg:min-h-[340px]"
  >
    <p className="sr-only">Turn your notes into flashcards and flip through them to study.</p>

    {/* Centred in the space below the title */}
    <div aria-hidden="true" className="relative z-10 flex h-full items-center px-6 pb-5 pt-14 md:pt-16 lg:px-8 lg:pb-7 lg:pt-[68px]">
      <div className="relative mx-auto w-full max-w-[290px] md:max-w-[310px] lg:max-w-[380px]">
        <div className={`${CARD} relative z-10 px-4 py-3.5 lg:rounded-xl lg:px-6 lg:py-5`}>
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-indigo-500 px-2 py-0.5 text-[11px] font-medium text-white lg:px-2.5 lg:py-1 lg:text-[13px]">Physics</span>
            <span className={`text-[11px] lg:text-[13px] ${MUTED}`}>Card 3 of 12</span>
          </div>
          <p className="mt-3 text-center text-[17px] font-semibold leading-snug text-[#111118] lg:mt-5 lg:text-2xl dark:text-slate-100">
            What is Newton&apos;s 2nd Law?
          </p>
          <div className="mt-3 flex justify-center lg:mt-5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e2ec] px-3 py-1 text-[11px] text-indigo-500 lg:gap-2 lg:px-4 lg:py-1.5 lg:text-[13px] dark:border-white/10 dark:text-indigo-300">
              <RotateCw className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
              Flip
            </span>
          </div>
        </div>

        {/* Next card peeking in from the right; the tile clips it */}
        <div className={`${CARD} absolute left-[calc(100%+14px)] top-0 h-full w-full lg:rounded-xl`} />

        <div className="mx-auto mt-3 h-1.5 w-1/2 rounded-full bg-indigo-100 lg:mt-5 lg:h-2 dark:bg-white/10">
          <div className="h-full w-1/4 rounded-full bg-indigo-500" />
        </div>
      </div>
    </div>
  </BentoTile>
);

export default FlashcardsTile;
