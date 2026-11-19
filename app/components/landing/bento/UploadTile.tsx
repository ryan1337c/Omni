import BentoTile from './BentoTile';
import DotBeltLazy from './DotBeltLazy';
import { MUTED } from './styles';

const UploadTile = () => (
  <BentoTile
    title="Upload and analyze files"
    href="/pages/home"
    linkLabel="Open Omni to upload and analyze files"
    className="min-h-[260px] md:col-span-2 md:min-h-[300px] lg:col-span-6 lg:min-h-[330px]"
  >
    <p className="sr-only">Drop in documents and Omni will analyze, summarize or transform them.</p>

    {/* Soft glow behind the centre */}
    <div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 h-48 w-[22rem] max-w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(244,114,182,0.22),transparent)] lg:h-64 lg:w-[30rem] dark:bg-[radial-gradient(closest-side,rgba(99,102,241,0.25),transparent)]"
    />

    <DotBeltLazy />

    <div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 lg:gap-2.5"
    >
      <div className="relative grid h-11 w-9 place-items-center rounded-lg bg-pink-300/60 lg:h-14 lg:w-12 lg:rounded-xl dark:bg-indigo-400/60">
        <span className="absolute right-0 top-0 h-3 w-3 rounded-bl-md rounded-tr-lg bg-white/50 lg:h-4 lg:w-4 lg:rounded-tr-xl dark:bg-white/20" />
        <span className="mt-2 text-[8px] font-bold tracking-wide text-white lg:mt-3 lg:text-[10px]">PDF</span>
      </div>
      <span className={`text-[10px] lg:text-xs ${MUTED}`}>Drop files here</span>
    </div>
  </BentoTile>
);

export default UploadTile;
