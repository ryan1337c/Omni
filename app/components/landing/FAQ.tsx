'use client';

import { useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ChevronRight, Plus } from 'lucide-react';

type QA = { q: string; a: string };
type Category = { id: string; label: string; items: QA[] };

const CATEGORIES: Category[] = [
  {
    id: 'pricing',
    label: 'Getting started & pricing',
    items: [
      {
        q: 'Is Omni free to use? How do credits work?',
        a: 'Yes. You get 20 free credits every day, no card needed. A chat message costs 1 credit and an image costs 8. Credits reset daily at midnight UTC, and if a request fails you get the credits back.',
      },
      {
        q: "What's the difference between the free and paid plans?",
        a: 'Free gives you chat and image generation with 20 credits a day. Pro is $5 CAD a month and adds Resume Tailor, quiz generation and flashcard generation, plus 2,500 credits a month and longer chat memory.',
      },
      {
        q: 'Can I cancel or change my plan anytime?',
        a: 'Yes. Cancel anytime in Settings under Billing & Plan, and you keep Pro until the end of the period you already paid for. You can also update your payment details through the billing portal.',
      },
      {
        q: 'Do unused credits roll over?',
        a: "No. Free credits reset every day and Pro credits reset on the 1st of each month, so unused ones don't carry over.",
      },
    ],
  },
  {
    id: 'models',
    label: 'Models & features',
    items: [
      {
        q: 'Which AI models can I use, and can I switch between them?',
        a: "You can choose from several leading AI models in the chat's model menu and switch whenever you like, even mid-study session. You can also generate images right from the chat.",
      },
      {
        q: 'Why use Omni instead of ChatGPT or Claude directly?',
        a: "Omni puts several AI models in one place and adds study tools those apps don't have: it builds quizzes from your notes or past tests, makes flashcard decks, and tailors your resume to a job posting. Everything is saved in one account.",
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy & data',
    items: [
      {
        q: 'Is my data private? Do you use my chats or files to train AI models?',
        a: "Your chats and uploads are saved to your account so only you can come back to them, and we never sell your personal data. Messages are sent to our AI providers to generate answers, and we don't use your content to train models.",
      },
      {
        q: 'Can I delete my account and my data?',
        a: 'Yes. Go to Settings, then Account, then Delete. Your account and saved data are permanently removed and any active subscription is canceled. You can also delete individual chats anytime.',
      },
    ],
  },
  {
    id: 'responsibly',
    label: 'Using Omni responsibly',
    items: [
      {
        q: 'How accurate are the answers? Can AI make mistakes?',
        a: 'AI can sound confident and still be wrong, especially on math, citations and recent events. Use Omni as a study aid and double-check anything important against your course materials.',
      },
      {
        q: 'Is using Omni considered cheating?',
        a: 'It depends on your school and course, so check your instructor\'s policy on AI tools. Omni is built for studying, with practice quizzes, flashcards and explanations, not for handing in AI-written work.',
      },
    ],
  },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const FAQ = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  const selectCategory = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    setOpenIndex(0);
  };

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (index + 1) % CATEGORIES.length
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (index - 1 + CATEGORIES.length) % CATEGORIES.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? CATEGORIES.length - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    selectCategory(CATEGORIES[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      id="faq"
      ref={ref}
      aria-labelledby="faq-title"
      className="scroll-mt-24 w-full px-4 pb-20 pt-6 sm:px-6"
    >
      <div
        className={`relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[2rem] border border-black/5 bg-white/40 px-5 py-12 dark:border-white/10 dark:bg-slate-900/50 sm:px-10 sm:py-16 transition-all duration-1000 ease-out motion-reduce:transition-none ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Pastel wash */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-36 -top-36 h-72 w-72 rounded-full bg-[#ff9bc3]/20 blur-3xl dark:bg-[#ff9bc3]/5" />
          <div className="absolute -right-36 -top-36 h-72 w-72 rounded-full bg-[#beacfe]/25 blur-3xl dark:bg-[#beacfe]/6" />
          <div className="absolute -bottom-36 -left-36 h-72 w-72 rounded-full bg-[#fccdbe]/25 blur-3xl dark:bg-[#fccdbe]/4" />
          <div className="absolute -bottom-36 -right-36 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl dark:bg-cyan-300/4" />
          <span className="absolute left-[3%] top-[14%] h-2 w-2 rounded-full bg-[#ff9bc3]/70 dark:bg-[#ff9bc3]/40" />
          <span className="absolute right-[10%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#beacfe] dark:bg-[#beacfe]/50" />
          <span className="absolute bottom-[10%] left-[2%] h-1.5 w-1.5 rounded-full bg-[#fccdbe] dark:bg-[#fccdbe]/40" />
          <span className="absolute bottom-[5%] right-[2.5%] h-2 w-2 rounded-full bg-cyan-300/70 dark:bg-cyan-300/30" />
        </div>

        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="faq-title"
              className="text-4xl font-semibold tracking-tight text-[#0f172a] dark:text-white sm:text-5xl"
            >
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 sm:text-lg">
              Everything you need to know about Omni, credits and your data.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 sm:mt-12 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-8">
            {/* Categories */}
            <div
              role="tablist"
              aria-label="FAQ categories"
              aria-orientation="vertical"
              className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-col"
            >
              {CATEGORIES.map((cat, i) => {
                const selected = cat.id === activeId;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => { tabRefs.current[i] = el; }}
                    id={`faq-tab-${cat.id}`}
                    role="tab"
                    type="button"
                    aria-selected={selected}
                    aria-controls="faq-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectCategory(cat.id)}
                    onKeyDown={(e) => onTabKeyDown(e, i)}
                    className={`flex w-full min-h-10 min-w-0 items-center justify-between gap-3 whitespace-normal rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors duration-200 motion-reduce:transition-none sm:px-5 lg:py-4 ${FOCUS_RING} ${
                      selected
                        ? 'bg-white text-[#0f172a] shadow-sm dark:bg-slate-700/80 dark:text-white dark:ring-1 dark:ring-white/10 dark:shadow-none'
                        : 'bg-white/45 text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="min-w-0 whitespace-normal">{cat.label}</span>
                    <ChevronRight
                      aria-hidden
                      className={`hidden size-4 flex-none transition-opacity lg:block ${selected ? 'opacity-70' : 'opacity-40'}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Questions */}
            <div
              id="faq-panel"
              role="tabpanel"
              aria-labelledby={`faq-tab-${active.id}`}
              className="flex min-w-0 flex-col gap-3"
            >
              {active.items.map((item, i) => {
                const open = openIndex === i;
                const baseId = `faq-${active.id}-${i}`;
                return (
                  <div
                    key={baseId}
                    className={`rounded-2xl transition-colors duration-200 motion-reduce:transition-none ${
                      open
                        ? 'bg-white shadow-sm dark:bg-slate-700/80 dark:ring-1 dark:ring-white/10 dark:shadow-none'
                        : 'bg-white/45 hover:bg-white/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <h3>
                      <button
                        type="button"
                        id={`${baseId}-btn`}
                        aria-expanded={open}
                        aria-controls={`${baseId}-answer`}
                        onClick={() => setOpenIndex(open ? null : i)}
                        className={`flex w-full min-h-10 min-w-0 items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left text-[15px] font-medium text-[#0f172a] dark:text-slate-100 sm:px-5 sm:text-base ${FOCUS_RING}`}
                      >
                        <span className="min-w-0 flex-1 whitespace-normal break-words">{item.q}</span>
                        <Plus
                          aria-hidden
                          className={`size-5 flex-none text-slate-500 transition-transform duration-300 ease-out motion-reduce:transition-none dark:text-slate-400 ${
                            open ? 'rotate-45' : 'rotate-0'
                          }`}
                        />
                      </button>
                    </h3>
                    <div
                      id={`${baseId}-answer`}
                      role="region"
                      aria-labelledby={`${baseId}-btn`}
                      inert={!open}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-4 pb-5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 sm:px-5">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;