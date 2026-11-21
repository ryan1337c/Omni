import ChatTile from './bento/ChatTile';
import ResumeTile from './bento/ResumeTile';
import FlashcardsTile from './bento/FlashcardsTile';
import QuizTile from './bento/QuizTile';
import UploadTile from './bento/UploadTile';
import VibeTile from './bento/VibeTile';
import PencilUnderline from './PencilUnderline';
import TiltGrid from './bento/TiltGrid';

// Features bento grid with a solid heading above it.
//   mobile  : one column, tiles stacked
//   md      : two columns (chat, quiz, upload and vibe go full width)
//   lg      : 12-column grid, rows of 8/4, 5/7 and 6/6 (about 400 / 340 / 360px tall)
// The grid is a container-query container so the row-1 wave can be sized from its width in CSS
// (see .bento-grid / .bento-swoosh in globals.css). No hooks here: the shell is server-safe.
const Bento = () => (
  <section id="features" className="scroll-mt-24 w-full px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-16">
    <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
        Everything in one place
      </p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl dark:text-white">
        Discover what&apos;s{' '}
        <PencilUnderline className="font-serif italic font-normal text-[#6366f1] dark:text-[#818cf8]">
          possible
        </PencilUnderline>
      </h2>
      <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
        Chat with any model, study smarter, tailor your resume and build things, without switching apps.
      </p>
    </header>
    <TiltGrid className="bento bento-grid mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
      <ChatTile />
      <ResumeTile />
      <FlashcardsTile />
      <QuizTile />
      <UploadTile />
      <VibeTile />
    </TiltGrid>
  </section>
);

export default Bento;
