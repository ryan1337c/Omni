"use client";
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

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
            <div className="flex-grow flex flex-col items-center justify-center p-6 pt-28">
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
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Tier 1: Free (Theme-Aware) */}
                <div className="backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transition-transform duration-300 hover:scale-105 bg-white/60 border-violet-200 dark:bg-slate-900/50 dark:border-indigo-500/30">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold mb-2 text-violet-600 dark:text-indigo-400">Free</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For individuals getting started with AI.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      $0 <span className="text-xl font-medium text-slate-500 dark:text-gray-400">/ month</span>
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Access to Basic AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>20 Credits per day</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Standard Customer Support</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={handlePlanAction}
                    disabled={isFreePlan}
                    className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold transition-colors duration-300 ${
                      isFreePlan
                        ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-btnDark dark:hover:bg-btnDarkHover"
                    }`}
                  >
                    {isFreePlan ? "Current plan" : "Get Started for Free"}
                  </button>
                </div>

                {/* Tier 2: Pro (Most Popular, Theme-Aware) */}
                <div className="backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transform scale-105 bg-white/60 border-violet-400 dark:bg-slate-900/50 dark:border-indigo-500">
                  <div className="relative -top-12 -right-8 self-end">
                    <div className="text-white text-sm font-bold px-4 py-1 rounded-full shadow-md bg-violet-600 dark:bg-btnDark">
                      Most Popular
                    </div>
                  </div>
                  <div className="flex-grow -mt-4">
                    <h2 className="text-3xl font-bold mb-2 text-fuchsia-500 dark:text-indigo-300">Pro</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For professionals who need more power.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>All Free Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Access to Advanced AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>125x higher usage than Free</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Priority Support</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={handlePlanAction}
                    disabled={isProPlan}
                    className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold transition-colors duration-300 ${
                      isProPlan
                        ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-btnDark dark:hover:bg-btnDarkHover"
                    }`}
                  >
                    {isProPlan ? "Current plan" : "Continue"}
                  </button>
                </div>

                {/* Tier 3: Enterprise (Theme-Aware) */}
                <div className="backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transition-transform duration-300 hover:scale-105 bg-white/60 border-violet-200 dark:bg-slate-900/50 dark:border-indigo-500/30">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold mb-2 text-pink-500 dark:text-indigo-200">Enterprise</h2>
                    <p className="mb-6 text-slate-500 dark:text-gray-400">For businesses requiring enterprise-grade features.</p>

                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className="space-y-4 text-slate-700 dark:text-gray-300">
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>All Pro Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Custom Model Integrations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Dedicated Account Manager</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Team Collaboration Tools</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-8 w-full cursor-not-allowed rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}