"use client";
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { Check, Shield, Sparkles, Users, Zap } from 'lucide-react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  { icon: Zap, lines: ["Fast", "Setup"] },
  { icon: Shield, lines: ["Secure &", "Private"] },
  { icon: Sparkles, lines: ["Powered by", "Best Models"] },
  { icon: Users, lines: ["Built for", "Everyone"] },
] as const;

const pillButton =
  "group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-300";

const planCardHover =
  "relative transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.04]";

const planTitleDark =
  "dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-400 dark:to-white";

function ExtendArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("h-4 w-4 shrink-0 overflow-visible", className)}
      aria-hidden
    >
      <g className="origin-[2px_8px] transition-transform duration-300 ease-out group-hover:scale-x-[1.4]">
        <line
          x1="2"
          y1="8"
          x2="10"
          y2="8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <polyline
        points="10,5 13,8 10,11"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 ease-out group-hover:translate-x-[3px]"
      />
    </svg>
  );
}

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isLoggedIn, tier } = useAuth();

  const handlePlanAction = () => {
    if (!isLoggedIn) {
      router.push('/pages/login');
      return;
    }

    router.push('/pages/home?settings=billing');
  };

  const isFreePlan = isLoggedIn && tier === "free";
  const isProPlan = isLoggedIn && tier === "pro";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <>
          <Header />
          <div className="flex flex-col min-h-screen text-black bg-landingPageLight dark:text-white dark:bg-landingPage animate-fade-in">
            <div className="flex-grow flex flex-col items-center justify-center p-6 pt-28 pb-16">
              {/* --- Page Header (Theme-Aware) --- */}
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 dark:from-indigo-400 dark:to-white mb-4">
                  Find the Perfect Plan
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-slate-600 dark:text-gray-400">
                  Start for free and scale up as you grow. Omni offers flexible pricing to meet the needs of every user, from individuals to large enterprises.
                </p>
              </div>

              {/* --- Pricing Tiers Container --- */}
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 items-stretch overflow-visible py-2">

                {/* Tier 1: Free */}
                <div className={cn("flex flex-col rounded-2xl border bg-white p-8 shadow-sm border-slate-200 dark:bg-slate-900/60 dark:border-indigo-500/30", planCardHover)}>
                  <div className="flex-grow">
                    <h2 className={cn("text-3xl font-bold mb-2 text-violet-600", planTitleDark)}>Free</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For individuals getting started with AI.</p>

                    <div className="text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">
                      $0 <span className="text-lg font-medium text-slate-400 dark:text-gray-400">/ month</span>
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Access to Basic AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>20 Credits per day</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Standard Customer Support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/10">
                    <button
                      type="button"
                      onClick={isFreePlan ? undefined : handlePlanAction}
                      aria-disabled={isFreePlan}
                      className={cn(
                        pillButton,
                        isFreePlan
                          ? "cursor-not-allowed bg-violet-200 text-violet-700 dark:bg-indigo-500/25 dark:text-indigo-200"
                          : "border-2 border-violet-400 bg-transparent text-violet-600 hover:bg-violet-50 dark:border-indigo-400 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      )}
                    >
                      {isFreePlan ? (
                        <>
                          <Check className="h-4 w-4 origin-center group-hover:animate-heartbeat" />
                          Current plan
                        </>
                      ) : (
                        <>
                          Get started for free
                          <ExtendArrowIcon />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tier 2: Pro (Most Popular) */}
                <div className={cn("flex flex-col rounded-2xl border bg-gradient-to-b from-violet-50 to-violet-100/70 p-8 shadow-md shadow-violet-200/60 border-violet-300 dark:from-indigo-500/15 dark:to-indigo-950/40 dark:border-indigo-500/40 dark:shadow-[0_0_25px_3px_rgba(99,102,241,0.18)]", planCardHover)}>
                  <span className="absolute -top-3.5 right-6 rounded-full bg-violet-500 px-4 py-1 text-xs font-bold text-white shadow-md dark:bg-btnDark dark:text-white">
                    Most Popular
                  </span>
                  <div className="flex-grow">
                    <h2 className={cn("text-3xl font-bold mb-2 text-violet-800", planTitleDark)}>Pro</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For professionals who need more power.</p>

                    <div className="text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">
                      $5 CAD <span className="text-lg font-medium text-slate-400 dark:text-gray-400">/ month</span>
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>All Free Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Access to Advanced AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>125x higher usage than Free</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Priority Support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 border-t border-violet-200/80 pt-6 dark:border-indigo-400/20">
                    <button
                      type="button"
                      onClick={isProPlan ? undefined : handlePlanAction}
                      aria-disabled={isProPlan}
                      className={cn(
                        pillButton,
                        isProPlan
                          ? "cursor-not-allowed bg-violet-200 text-violet-700 dark:bg-indigo-500/30 dark:text-indigo-100"
                          : "bg-violet-200 text-violet-700 hover:bg-violet-300 dark:bg-indigo-500/25 dark:text-indigo-100 dark:hover:bg-indigo-500/40"
                      )}
                    >
                      {isProPlan ? (
                        <>
                          <Check className="h-4 w-4 origin-center group-hover:animate-heartbeat" />
                          Current plan
                        </>
                      ) : (
                        "Continue"
                      )}
                    </button>
                  </div>
                </div>

                {/* Tier 3: Enterprise */}
                <div className={cn("flex flex-col rounded-2xl border bg-white p-8 shadow-sm border-slate-200 dark:bg-slate-900/60 dark:border-indigo-500/30", planCardHover)}>
                  <div className="flex-grow">
                    <h2 className={cn("text-3xl font-bold mb-2 text-pink-500", planTitleDark)}>Enterprise</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For businesses requiring enterprise-grade features.</p>

                    <div className="text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">
                      TBD
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>All Pro Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Custom Model Integrations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Dedicated Account Manager</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                        <span>Team Collaboration Tools</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/10">
                    <button
                      type="button"
                      disabled
                      className={cn(
                        pillButton,
                        "cursor-not-allowed border-2 border-slate-200 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500"
                      )}
                    >
                      Coming soon
                    </button>
                  </div>
                </div>
              </div>

              {/* --- Feature highlights --- */}
              <div className="mt-16 w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-0">
                {HIGHLIGHTS.map(({ icon: Icon, lines }, index) => (
                  <div
                    key={lines.join(" ")}
                    className={cn(
                      "flex items-center justify-center gap-3 px-4",
                      index > 0 && "md:border-l md:border-violet-200 md:dark:border-indigo-500/20"
                    )}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-500 dark:bg-indigo-500/20 dark:text-indigo-300">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium leading-tight text-slate-600 dark:text-slate-300">
                      {lines.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
