import BentoTile from './BentoTile';

// Deterministic 0/1 filler for the faint background (same on server and client).
const BINARY = (() => {
  let seed = 12345;
  const rows: string[] = [];
  for (let r = 0; r < 22; r++) {
    let row = '';
    for (let c = 0; c < 80; c++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      row += seed % 2 === 0 ? '0' : '1';
    }
    rows.push(row);
  }
  return rows.join('\n');
})();

type Kind = 'k' | 'f' | 's' | 'n' | 'p';
type Token = readonly [Kind, string];

// A small React snippet, pre-split into syntax-coloured tokens.
const CODE: ReadonlyArray<ReadonlyArray<Token>> = [
  [['k', 'export'], ['p', ' '], ['k', 'function'], ['p', ' '], ['f', 'Flashcard'], ['p', '({ card }) {']],
  [['p', '  '], ['k', 'const'], ['p', ' [flip, setFlip] = '], ['f', 'useState'], ['p', '('], ['n', 'false'], ['p', ');']],
  [['p', '  '], ['k', 'return'], ['p', ' (']],
  [['p', '    '], ['s', '<div'], ['f', ' onClick'], ['p', '={() => '], ['f', 'setFlip'], ['p', '(!flip)}'], ['s', '>']],
  [['p', '      {flip ? card.answer : card.question}']],
  [['p', '    '], ['s', '</div>']],
  [['p', '  );']],
  [['p', '}']],
];

const TOKEN_CLASS: Record<Kind, string> = {
  k: 'text-[#7c3aed] dark:text-indigo-400',
  f: 'text-[#0d9488] dark:text-sky-300',
  s: 'text-[#db2777] dark:text-pink-300',
  n: 'text-[#ea580c] dark:text-orange-300',
  p: 'text-[#1e1e28] dark:text-slate-200',
};

const VibeTile = () => (
  <BentoTile
    title="Vibe coding"
    href="/pages/home"
    linkLabel="Open Omni to start vibe coding"
    className="min-h-[260px] md:col-span-2 lg:col-span-6 lg:min-h-[330px]"
  >
    <p className="sr-only">Code with an AI partner that writes and fixes code alongside you.</p>

    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre font-mono text-[11px] leading-4 tracking-[0.3em] text-[#ede8fa] lg:text-sm lg:leading-5 dark:text-slate-500/10"
    >
      {BINARY}
    </div>

    <div aria-hidden="true" className="relative z-10 px-4 pb-4 pt-14 sm:px-5 lg:flex lg:h-full lg:items-center lg:px-6 lg:pb-5 lg:pt-[60px]">
      <div className="overflow-hidden rounded-[10px] border border-[#e6e2ec] bg-white lg:w-full lg:rounded-xl shadow-[0_6px_16px_rgba(90,60,140,0.12)] dark:border-white/10 dark:bg-[#1e2633] dark:shadow-[0_8px_20px_rgba(5,8,15,0.35)]">
        <div className="flex items-center gap-1.5 border-b border-[#ece8ee] px-3 py-2 lg:gap-2 lg:px-4 lg:py-3 dark:border-white/10">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] lg:h-3 lg:w-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5b400] lg:h-3 lg:w-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] lg:h-3 lg:w-3" />
          <span className="ml-3 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 lg:px-2.5 lg:py-1 lg:text-[13px] dark:bg-white/5 dark:text-slate-400">
            Flashcard.tsx
          </span>
        </div>
        <div className="flex font-mono text-[10.5px] leading-5 sm:text-xs md:text-[13px] lg:text-sm lg:leading-5">
          <div className="select-none py-2 pl-3 pr-3 text-right lg:py-3 lg:pl-4 lg:pr-4 text-slate-400 dark:text-slate-500">
            {CODE.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Long lines are clipped (with a fade on small screens) instead of scrolling the page */}
          <pre className="min-w-0 flex-1 overflow-hidden py-2 pr-3 lg:py-3 lg:pr-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] sm:[mask-image:none]">
            <code>
              {CODE.map((line, i) => (
                <span key={i} className="block">
                  {line.map(([kind, text], j) => (
                    <span key={j} className={TOKEN_CLASS[kind]}>
                      {text}
                    </span>
                  ))}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  </BentoTile>
);

export default VibeTile;
