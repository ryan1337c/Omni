"use client"
import { useAuth } from './context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faXmark} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useRef} from 'react';
import { useRouter } from 'next/navigation';
import { SparklesText } from "@/components/magicui/sparkles-text";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FlipText } from "@/components/magicui/flip-text";
import { Beam } from '@/components/magicui/beam';
import { useInView } from 'react-intersection-observer';
import { MarqueeDemo } from '@/components/magicui/review-cards';
import { FaStar, FaGithub, FaPlay} from 'react-icons/fa';
import { BsChatDots, BsCpu, BsFileText, BsImage, BsUpload, BsCodeSlash, BsPatchQuestion, BsStickies } from 'react-icons/bs';
import CountUp from 'react-countup';
import Header from './components/Header';
import { RainbowButton } from "@/components/ui/rainbow-button"
import FeatureCard from '@/components/ui/FeatureCard';
import { Feature } from '@/components/types/types';


export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heroVideoSectionSeen, setHeroVideoSectionSeen] = useState(false);
  const [flipTextAnimationDone, setFlipTextAnimationDone] = useState(false);

  // State for Privacy Policy Modal
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
    }
  };

  const features: Feature[] = [
    {
      icon: BsChatDots,
      title: 'General Chatting',
      description: 'Engage in natural, intelligent conversations for answers, ideas, and creative collaboration.',
    },
    {
      icon: BsCpu,
      title: 'LLM Model Selection',
      description: 'Switch between a variety of powerful large language models to find the perfect mind for your specific task.',
    },
    {
      icon: BsFileText,
      title: 'Resume Tailor',
      description: 'Optimize your resume for any job application by letting our AI tailor it to match the job description perfectly.',
    },
    {
      icon: BsImage,
      title: 'Image Generation',
      description: 'Bring your ideas to life. Generate stunning, high-quality images from simple text descriptions in seconds.',
    },
    {
      icon: BsPatchQuestion,
      title: 'Quiz Generation',
      description: 'Test your knowledge with custom quizzes. Choose between instant AI automation from your documents or manual creation for total control.',
    },
    {
      icon: BsStickies,
      title: 'Flashcard Generation',
      description: 'Level up your study sessions. Seamlessly switch between AI-powered automated cards and precise manual entry.',
    },
    {
      icon: BsUpload,
      title: 'File Upload & Process',
      description: 'Securely upload documents and files for the AI to analyze, summarize, or transform based on your needs.',
    },
    {
      icon: BsCodeSlash,
      title: 'Vibe Coding',
      description: 'Code in real-time with an AI partner that suggests solutions and helps you squash bugs before they happen.',
    }  
  ];

  // Observer for the User Count section
  const { ref: userCountRef, inView: userCountInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

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

  // Obeserver for the First section
  const { ref: robotRef, inView: robotInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Observer for the Feature section
  const { ref: featuresRef, inView: featuresInView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.2 
  });

  // Observer for the video demo ref (no triggerOnce so we can pause/restart when out of view)
  const { ref: heroVideoRef, inView: heroVideoInView } = useInView({ 
    threshold: 0.2,
  });

  // Add this with your other observer hooks
  const { ref: flipTextRef, inView: flipTextInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mark hero video section as "seen" only after the first fade-in has finished (so we see the animation)
  useEffect(() => {
    if (!heroVideoInView) return;
    const t = setTimeout(() => setHeroVideoSectionSeen(true), 1200);
    return () => clearTimeout(t);
  }, [heroVideoInView]);

  // After flip text has been in view and animated once, switch to static text so it never replays on scroll
  useEffect(() => {
    if (!flipTextInView) return;
    const t = setTimeout(() => setFlipTextAnimationDone(true), 2000);
    return () => clearTimeout(t);
  }, [flipTextInView]);

  useEffect(() => {
    // If the video is not in view and it was playing, reset it.
    if (!heroVideoInView && isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.load();
        setIsPlaying(false);
      }
    }
  }, [heroVideoInView, isPlaying]);

  return (
    <>
      {mounted && (
        <div className={`flex flex-col min-h-screen dark:text-white dark:bg-landingPage text-black bg-landingPageLight overflow-hidden`}>
          <Header />
          <div className="flex flex-col items-center lg:flex-row px-4 pt-10 " >
            {/* Left Side */}
            <div className="md:w-1/2 mt-16 min-h-[45vh]">
              <div className="flex flex-col items-center md:flex-none md:items-start lg:ml-40">
                <SparklesText className="sm:text-8xl lg:text-9xl -ml-[0.4rem] animate-fade-in " sparklesCount={5}>Omni</SparklesText>
                <div ref={flipTextRef} className="sm:text-3xl md:text-4xl font-bold flex gap-2">
                  {flipTextAnimationDone ? (
                    <>
                      <div className="flex space-x-0.5">
                        {"Fast.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-500 text-violet-600">{char}</span>
                        ))}
                      </div>
                      <div className="flex space-x-0.5">
                        {"Smart.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-300 text-fuchsia-500">{char}</span>
                        ))}
                      </div>
                      <div className="flex space-x-0.5">
                        {"Limitless.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-100 text-pink-500">{char}</span>
                        ))}
                      </div>
                    </>
                  ) : flipTextInView ? (
                    <>
                      <FlipText className="dark:text-indigo-500 text-violet-600">Fast.</FlipText>
                      <FlipText className="dark:text-indigo-300 text-fuchsia-500">Smart.</FlipText>
                      <FlipText className="dark:text-indigo-100 text-pink-500">Limitless.</FlipText>
                    </>
                  ) : (
                    <>
                      <div className="flex space-x-0.5">
                        {"Fast.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-500 text-violet-600">{char}</span>
                        ))}
                      </div>
                      <div className="flex space-x-0.5">
                        {"Smart.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-300 text-fuchsia-500">{char}</span>
                        ))}
                      </div>
                      <div className="flex space-x-0.5">
                        {"Limitless.".split("").map((char, i) => (
                          <span key={i} className="origin-center drop-shadow-sm dark:text-indigo-100 text-pink-500">{char}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-8 mb-6 animate-fade-in">
                  Unlock the power of AI models — Omni connects you with cutting-edge agents to supercharge your workflows, automate tasks, and amplify your creativity. Fast, smart, limitless. Your AI assistant, reimagined.
                </div>
                <div className="sm:flex sm:justify-center lg:flex-none lg:justify-start animate-fade-in">
                  <RainbowButton
                    className={`p-5 flex gap-2 items-center rounded-lg dark:bg-launch bg-landingPageLight`}
                    id="launch"
                    onClick={() => {
                      router.push("/pages/home");
                    }}
                    variant={'outline'}
                    size={"lg"}
                    >
                    <FontAwesomeIcon icon={faRocket} id="rocket" />
                    Launch App 
                  </RainbowButton>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div ref={robotRef} className= {`hidden md:w-1/2 lg:flex justify-center item-start transition-opacity duration-1000 ease-in ${robotInView ? 'opacity-100' : 'opacity-0'}`}>
              <DotLottieReact
                src="https://lottie.host/bd5cdb29-22ca-4570-9be6-8bf14baced57/gf7DNNCIz5.lottie"
                autoplay
                loop
                className="w-[400px] h-[250px] md:w-[500px] md:h-[350px] flex-shrink-0"
              />
            </div>
          </div>

          {/* Amount of Users Section */}
          <div ref={userCountRef} className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-16 px-4 py-16">
            <div className={`lg:w-5/12 transition-opacity duration-1000 ease-in ${userCountInView ? 'opacity-100' : 'opacity-0'}`}>
              <DotLottieReact
                src="https://lottie.host/a86367a7-40a0-4610-852e-0529f33a6665/HhwVsdInam.lottie"
                autoplay
                loop
                className="w-full max-w-[700px] mx-auto"
              />
            </div>

            <div className={`lg:w-6/12 text-center lg:text-left`}>
              <h3 className={`text-6xl md:text-8xl font-bold transition-opacity duration-700 ease-in ${userCountInView ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`text-transparent bg-clip-text bg-gradient-to-r dark:from-indigo-400 dark:to-blue-600 from-violet-600 to-pink-500`}>
                  {userCountInView && <CountUp end={100} duration={2.5} suffix="+" />}
                </span>
              </h3>

              <p className={`mt-4 text-2xl md:text-3xl font-semibold dark:text-gray-200 text-black transition-all duration-700 ease-in-out delay-200 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Pioneers Building the Future.
              </p>

              <p className={`mt-3 text-lg md:text-xl dark:text-gray-400 text-black  transition-all duration-700 ease-in-out delay-500 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Our early adopters are already unlocking a smarter way to work with Omni&apos;s unified AI. They answer complex questions, generate stunning visuals, and tailor professional resumes—all faster than ever before.
              </p>
            </div>
          </div>

            {/* --- Hero Video Section --- */}
            <section ref={heroVideoRef} className="w-full flex flex-col items-center py-16 px-4">
              <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r dark:from-indigo-400 dark:to-white from-violet-600 to-pink-500 ${heroVideoSectionSeen ? 'transition-none' : 'transition-opacity duration-1000 ease-in'} ${heroVideoInView ? 'opacity-100' : 'opacity-0'}`}>
                See Omni in Action
              </h2>
              <p className={`text-lg text-center max-w-2xl mb-8 dark:text-gray-400 text-gray-600 ${heroVideoSectionSeen ? 'transition-none' : 'transition-opacity duration-1000 ease-in delay-200'} ${heroVideoInView ? 'opacity-100' : 'opacity-0'}`}>
                A glimpse into the future of productivity and creative workflows.
              </p>
              <div className={`w-full max-w-5xl rounded-2xl overflow-hidden ${heroVideoSectionSeen ? 'transition-none' : 'transition-all duration-1000 ease-in-out'} ${heroVideoInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
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
                    src="OmniDemoHero.mp4#t=0.1"
                    preload="metadata"
                    muted
                    playsInline
                    controls={isPlaying}
                    onEnded={() => setIsPlaying(false)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>
          
            {/* --- Features Section --- */}
            <section ref={featuresRef} className="w-full flex flex-col items-center pt-20 pb-24 px-4">
              <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r dark:from-indigo-400 dark:to-white from-violet-600 to-pink-500 transition-opacity duration-1000 ease-in ${featuresInView ? 'opacity-100' : 'opacity-0'}`}>
                Discover What&apos;s Possible
              </h2>
               <p className={`text-lg text-center max-w-2xl mb-12 dark:text-gray-400 text-gray-600 transition-opacity duration-1000 ease-in delay-200 ${featuresInView ? 'opacity-100' : 'opacity-0'}`}>
                Omni is more than just a chatbot. It&apos;s a suite of powerful, interconnected AI tools designed to amplify your productivity and creativity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
                {features.map((feature, index) => (
                  <FeatureCard 
                    key={index} 
                    feature={feature} 
                    inView={featuresInView}
                    index={index}
                  />
                ))}
              </div>
            </section>

          {/* --- Unified AI Core Section  --- */}
          <div ref={coreRef} className="w-full flex flex-col items-center pt-10 pb-16 px-4">
            <h2 className={`text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r dark:from-indigo-400 dark:to-white from-violet-600 to-pink-500   transition-opacity duration-1000 ease-in ${coreInView ? 'opacity-100' : 'opacity-0'}`}>
              One Interface. Many Minds.
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
            <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r dark:from-indigo-400 dark:to-white from-violet-600 to-pink-500 transition-opacity duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
              Testimonials
            </h2>
            <div className={`flex items-center gap-1 mb-10 transition-all delay-200 duration-1000 ease-in-out ${testimoniesInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}`}>
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
            </div>
              <div className={`w-full px-4 sm:px-8 md:px-20 lg:px-40 transition-opacity delay-300 duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
              <MarqueeDemo />
            </div>
          </div>

          {/* --- Footer Section --- */}
          <footer className={`
            w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center 
            gap-3 sm:gap-0 py-5 px-10 mt-auto 
            border-t dark:bg-black/20 dark:border-white/10 bg-white/50 border-black/10
          `}>
            <div className="flex flex-col items-center sm:items-start gap-3">
                <p className={`text-sm font-medium dark:text-gray-400 text-slate-600`}>
                © 2025 Omni | All Rights Reserved
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
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
                    <p>Omni collects minimal data necessary to provide AI services, including account information (email) and usage metadata to improve model performance. We do not sell your personal data to third parties.</p>
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
      )}
    </>
  );
}
