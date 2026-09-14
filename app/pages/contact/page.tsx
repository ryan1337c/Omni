'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import { FaEnvelope, FaGithub, FaLinkedin, FaPaperPlane, FaUser } from 'react-icons/fa';
import Header from '@/app/components/Header';
import { Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'error', message: string}>({
    type: 'idle',
    message: 'Send Message',
  })

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: 'sending', message: 'Sending...'});
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const { name, email, message} = data;

    try {
        const response = await fetch("/api/contact", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        const responseData = await response.json();
        const msg = responseData.message;
        if (response.ok) {
            setStatus({ type: 'idle', message: 'Send Message'});
            (event.target as HTMLFormElement).reset();
        } else {
            setStatus({ type: 'error', message: msg });
        }
    } catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
        setStatus({ type: 'error', message: message});
    }
  };

  return (
    <>
        {mounted && (
            <>
                <Header />
                <div className="flex flex-col min-h-screen text-black bg-landingPageLight dark:text-white dark:bg-landingPage animate-fade-in">
                    <div className="flex-grow flex items-center justify-center p-6 pt-28">
                        <div className="max-w-5xl w-full">

                            {/* --- Page Header (Theme-Aware) --- */}
                            <div className="text-center mb-12">
                                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r mb-4 from-violet-600 to-pink-500 dark:from-indigo-400 dark:to-white">
                                    Get In Touch
                                </h1>
                                <p className="text-lg max-w-2xl mx-auto text-slate-600 dark:text-gray-400">
                                    Have a question, a project proposal, or just want to connect? I&apos;d love to hear from you.
                                </p>
                            </div>

                            {/* --- Main Content Box (Theme-Aware) --- */}
                            <div className="backdrop-blur-sm border rounded-2xl shadow-lg p-8 md:p-12 bg-white/60 border-violet-200 dark:bg-slate-900/50 dark:border-indigo-500/20">
                                <div className="grid md:grid-cols-2 gap-12 items-start">

                                    {/* --- Left Column (Theme-Aware) --- */}
                                    <div className="flex flex-col gap-8">
                                        <div>
                                            <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-white">Contact Information</h2>
                                            <p className="mb-6 text-slate-500 dark:text-gray-400">
                                                Feel free to contact me by email or connect on my professional networks for questions, issues, or suggestions for improvement.
                                            </p>
                                            
                                            <a href="mailto:ryanchen1337@gmail.com"
                                            className="flex items-center gap-4 text-lg transition-colors duration-300 group text-slate-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-indigo-400"
                                            >
                                            <FaEnvelope className="size-6 transition-colors duration-300 text-slate-800 group-hover:text-violet-600 dark:text-white dark:group-hover:text-indigo-400" />
                                            <span>ryanchen1337@gmail.com</span>
                                            </a>
                                        </div>

                                        <div>
                                            <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-white">Follow Me</h2>
                                            <div className="flex items-center gap-6">
                                                <Link href="https://github.com/ryan1337c" target="_blank" rel="noopener noreferrer">
                                                    <FaGithub className="size-8 transition-colors duration-300 text-slate-500 hover:text-black dark:text-gray-400 dark:hover:text-white" />
                                                </Link>
                                                <Link href="https://www.linkedin.com/in/ryan-chen-296094239/" target="_blank" rel="noopener noreferrer">
                                                    <FaLinkedin className="size-8 transition-colors duration-300 text-slate-500 hover:text-black dark:text-gray-400 dark:hover:text-white" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Right Column: Contact Form (Theme-Aware) --- */}
                                    <div>
                                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-white">Send a Message</h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Name Input */}
                                        <div className="relative">
                                        <input
                                            type="text" id="name" name="name" required
                                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-1 transition-shadow duration-300 bg-slate-100/60 border-slate-300 text-black placeholder-slate-400 focus:ring-violet-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-indigo-500"
                                            placeholder="Your Name"
                                        />
                                        <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                        </div>

                                        {/* Email Input */}
                                        <div className="relative">
                                        <input
                                            type="email" id="email" name="email" required
                                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-1 transition-shadow duration-300 bg-slate-100/60 border-slate-300 text-black placeholder-slate-400 focus:ring-violet-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-indigo-500"
                                            placeholder="Your Email"
                                        />
                                        <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                        </div>

                                        {/* Message Textarea */}
                                        <div>
                                            <textarea
                                                id="message" name="message" rows={5} required
                                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-1 transition-shadow duration-300 bg-slate-100/60 border-slate-300 text-black placeholder-slate-400 focus:ring-violet-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-indigo-500"
                                                placeholder="Your Message"
                                            ></textarea>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                        type="submit" disabled={status.type === 'sending'}
                                        className="w-full flex items-center justify-center gap-3 py-3 px-6 text-white font-semibold rounded-lg transition-all duration-300 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 dark:bg-btnDark dark:hover:bg-btnDarkHover dark:disabled:bg-indigo-800"
                                        >
                                        {status.type === 'sending' ? (
                                            <><Loader2 className="animate-spin" size={20} /><span>{status.message}</span></>
                                        ) : (
                                            <><span className={status.type === 'error' ? 'text-red-300' : ''}>{status.message}</span><FaPaperPlane /></>
                                        )}
                                        </button>
                                    </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )}
    </>
  );
}