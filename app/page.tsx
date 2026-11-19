"use client"
import { useAuth } from './context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Beam } from '@/components/magicui/beam';
import { useInView } from 'react-intersection-observer';
import { MarqueeDemo } from '@/components/magicui/review-cards';
import { FaStar, FaGithub, FaPlay, FaStarHalfAlt } from 'react-icons/fa';
import Header from './components/Header';
import Hero from './components/landing/Hero';
import UniversityStrip from './components/landing/UniversityStrip';
import Bento from './components/landing/Bento';
import FAQ from './components/landing/FAQ';


export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heroVideoSectionSeen, setHeroVideoSectionSeen] = useState(false);

  // State for Privacy Policy Modal
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  const handlePlayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    // play() returns a promise; it rejects with AbortError if pause() runs before playback starts
    video.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error(err);
      setIsPlaying(false);
    });
  };

  // Observer for the Unified Core section
  const { ref: coreRef, inView: coreInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Observer for the Testimonies section
  const { ref: testimoniesRef, inView: testimoniesInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Observer for the video demo ref (no triggerOnce so we can pause/restart when out of view)
  const { ref: heroVideoRef, inView: heroVideoInView } = useInView({ 
    threshold: 0.2,
  });

  // Mark hero video section as "seen" only after the first fade-in has finished (so we see the animation)
  useEffect(() => {
    if (!heroVideoInView) return;
    const t = setTimeout(() => setHeroVideoSectionSeen(true), 1200);
    return () => clearTimeout(t);
  }, [heroVideoInView]);

  useEffect(() => {
    // If the video is not in view and it was playing, reset it.
    if (!heroVideoInView && isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [heroVideoInView, isPlaying]);

  // The demo fades in once and then stays visible; heroVideoInView keeps driving pause/reset only
  // Separate one-shot observer so the fade-in can only ever happen once
  const { ref: demoRevealRef, inView: demoRevealed } = useInView({ triggerOnce: true, threshold: 0.2 });

  // Smooth-scroll to the demo section without touching the URL (used by the hero's "Watch demo")
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const setDemoSectionRef = useCallback(
    (el: HTMLElement | null) => {
      demoSectionRef.current = el;
      heroVideoRef(el);
      demoRevealRef(el);
    },
    [heroVideoRef, demoRevealRef],
  );
  const scrollToDemo = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    demoSectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <>
      <div className={`flex flex-col min-h-screen dark:text-white dark:bg-landingPage text-black bg-landingPageLight overflow-hidden`}>
        <Header />
        <Hero onWatchDemo={scrollToDemo} />
        <UniversityStrip />
        <Bento />

          {/* --- Hero Video Section --- */}
          <section id="demo" ref={setDemoSectionRef} className="scroll-mt-24 w-full flex flex-col items-center py-16 px-4">
            <div className={`flex flex-col items-center text-center ${heroVideoSectionSeen ? 'transition-none' : 'transition-opacity duration-1000 ease-in'} ${demoRevealed ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl dark:text-white">
                See Omni{' '}
                {/* Play-button chip set into the title (same palette as the hero orb); also starts the video.
                    On hover the play icon follows the cursor left/right, staying inside the pill. */}
                <button
                  type="button"
                  onClick={handlePlayVideo}
                  onPointerMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
                    e.currentTarget.style.setProperty('--px', x.toFixed(3));
                  }}
                  onPointerLeave={(e) => e.currentTarget.style.setProperty('--px', '0')}
                  aria-label="Play the demo video"
                  className="group relative mx-1 inline-flex h-[0.9em] w-[1.6em] translate-y-[-0.06em] items-center justify-center rounded-full bg-gradient-to-br from-[#fccdbe] via-[#ff9bc3] to-[#beacfe] align-middle shadow-[0_6px_18px_-4px_rgba(255,155,195,0.7)] ring-1 ring-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:from-indigo-400 dark:via-violet-500 dark:to-fuchsia-500 dark:shadow-[0_6px_18px_-4px_rgba(139,92,246,0.7)] dark:ring-white/10"
                >
                  <FaPlay
                    aria-hidden="true"
                    className="relative ml-[0.06em] h-[0.36em] w-[0.36em] text-white drop-shadow-sm transition-transform duration-300 ease-out [transform:translateX(calc(var(--px,0)*0.4em))] motion-reduce:[transform:none]"
                  />                </button>{' '}
                in action              </h2>
            </div>
            <p className={`text-lg text-center max-w-2xl mb-8 dark:text-gray-400 text-gray-600 ${heroVideoSectionSeen ? 'transition-none' : 'transition-opacity duration-1000 ease-in delay-200'} ${demoRevealed ? 'opacity-100' : 'opacity-0'}`}>
              A glimpse into the future of productivity and creative workflows.
            </p>
            <div className={`w-full max-w-5xl rounded-2xl overflow-hidden ${heroVideoSectionSeen ? 'transition-none' : 'transition-all duration-1000 ease-in-out'} ${demoRevealed ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
                dark:shadow-[0_0_35px_5px_rgba(99,102,241,0.2)] shadow-[0_0_35px_5px_rgba(139,92,246,0.2)]
            `}>
              <div className="relative w-full aspect-video">
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 cursor-pointer" onClick={handlePlayVideo}>
                        <button
                            className="p-5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Play video"
                        >
                            <FaPlay className="w-8 h-8 ml-1" />
                        </button>
                    </div>
                )}
                <video
                  ref={videoRef}
                  src="/OmniDemoHero-720.mp4"
                  poster="/omniDemoPoster.png"
                  preload="none"
                  playsInline
                  controls={isPlaying}
                  onEnded={() => setIsPlaying(false)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        
        {/* --- Unified AI Core Section  --- */}
        <div ref={coreRef} className="w-full flex flex-col items-center pt-10 pb-16 px-4">
          <h2 className={`mb-10 pb-1 text-center text-4xl font-semibold tracking-tight sm:text-5xl bg-gradient-to-r from-[#4f46e5] via-[#9333ea] to-[#db2777] bg-clip-text text-transparent dark:from-[#a5b4fc] dark:via-[#d8b4fe] dark:to-[#f9a8d4] transition-opacity duration-1000 ease-in ${coreInView ? 'opacity-100' : 'opacity-0'}`}>
            One interface.{' '}<span className="font-serif font-normal italic pr-1">Many minds.</span>
          </h2>
          <div className={`
            w-full max-w-6xl p-3 rounded-2xl
            dark:bg-black/30 dark:border-indigo-500/30 dark:shadow-[0_0_25px_3px_rgba(99,102,241,0.25)] bg-white/50 border border-violet-300 shadow-[0_0_25px_3px_rgba(139,92,246,0.25)]}
            transition-all duration-1000 ease-in-out
            ${coreInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
          `}>
            <Beam />
          </div>
        </div>

        {/* --- Testimonies Section  --- */}
        <div ref={testimoniesRef} className="w-full flex flex-col items-center mb-20 py-10 px-4">
          <h2 className={`mb-6 text-center text-4xl font-semibold tracking-tight text-[#0f172a] sm:text-5xl dark:text-white transition-opacity duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
            Testimonials
          </h2>
          <div className={`flex items-center gap-1 mb-10 transition-all delay-200 duration-1000 ease-in-out ${testimoniesInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}`}>
            <FaStar className="size-6 text-yellow-400" />
            <FaStar className="size-6 text-yellow-400" />
            <FaStar className="size-6 text-yellow-400" />
            <FaStar className="size-6 text-yellow-400" />
            <FaStarHalfAlt className="size-6 text-yellow-400" />
          </div>
            <div className={`w-full px-4 sm:px-8 md:px-20 lg:px-40 transition-opacity delay-300 duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
            <MarqueeDemo />
          </div>
        </div>

        <FAQ />

        {/* --- Footer Section --- */}
        <footer className={`
          w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center 
          gap-3 sm:gap-0 py-5 px-10 mt-auto 
          border-t dark:bg-black/20 dark:border-white/10 bg-white/50 border-black/10
        `}>
          <div className="flex flex-col items-center sm:items-start gap-3">
              <p className={`text-sm font-medium dark:text-gray-400 text-slate-600`}>
              © 2026 Omni | All Rights Reserved
              </p>
              <button 
                  onClick={() => setIsPolicyOpen(true)}
                  className="text-xs dark:text-gray-500 text-slate-600 hover:underline transition-all"
              >
                  Privacy & Cookies Policy
              </button>
          </div>

          <a
            href="https://github.com/ryan1337c" 
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 dark:text-gray-400 dark:hover:text-white text-slate-600 hover:text-black transition-colors duration-300`}
          >
            <p className="text-sm font-medium">Created by Ryan Chen</p> 
            <FaGithub className="size-5" />
          </a>
        </footer>

        {/* --- Privacy & Cookies Modal --- */}
        {isPolicyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsPolicyOpen(false) }}>
            <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl p-8 border dark:border-white/10 shadow-2xl">
              <button 
                onClick={() => setIsPolicyOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="size-6" />
              </button>

              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 dark:from-indigo-400 dark:to-white">
                Privacy & Cookies Policy
              </h2>

              <div className="space-y-6 text-sm dark:text-gray-300 text-gray-600 leading-relaxed">
                <section>
                  <h3 className="text-lg font-semibold dark:text-white text-black mb-2">1. Information We Collect</h3>
                  <p>Omni collects minimal data necessary to provide AI services, including account information (email). We do not sell your personal data to third parties.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold dark:text-white text-black mb-2">2. How We Use AI Models</h3>
                  <p>When you interact with Omni, your prompts are processed by various LLMs. While we ensure secure transit, please avoid sharing sensitive personal identifiers within chats.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold dark:text-white text-black mb-2">3. Cookies & Tracking</h3>
                  <p> We use essential cookies to store your login state and maintain your session security. 
                    We also use analytical cookies via Vercel to understand how users interact with our interface to optimize the &quot;Omni&quot; experience. 
                    Our tracking is used strictly for performance optimization and does not track you across other websites.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold dark:text-white text-black mb-2">4. Data Security</h3>
                  <p>We implement industry-standard encryption to protect your files and chat history. You can request data deletion at any time via your account settings.</p>
                </section>

                <p className="pt-4 border-t dark:border-white/10 italic">
                  Last Updated: January 2025. By using Omni, you agree to these terms.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
