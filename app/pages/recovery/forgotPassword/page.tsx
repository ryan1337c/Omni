'use client'
import { useEffect, useState } from 'react';
import { AuthServices } from '@/lib/authServices';
import { MAX_EMAIL_LENGTH } from '@/lib/inputLimits';
import { useRouter } from 'next/navigation';
import { IoArrowBack } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { useTheme } from "next-themes";

export default function ForgotPassword () {
    const [mounted, setMounted] = useState(false);
    const router = useRouter(); 

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const { theme } = useTheme();
   
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const auth = new AuthServices();
        // Clear previous messages before a new submission
        setMessage('');
        setError('');
        try{
            await auth.sendResetLink(email);
            setMessage('If an account with that email exists, a password reset link has been sent.');
        }
        catch (error: any)
        {
            const message = error.message || 'An unexpected error occurred';
            console.error(message);
            setError(message);
        }
    }

    return(<>
        {mounted && (
            <div className="h-screen flex items-center justify-center p-5 bg-landingPageLight dark:bg-landingPage">
                <div className="relative flex flex-col bg-white text-black p-10 md:w-[500px] shadow-lg rounded-xl items-center">
                    
                    <button 
                        onClick={() => router.push('../login')} 
                        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-black font-semibold transition-colors focus:outline-none p-2"
                        aria-label="Back to Login"
                    >
                        <IoArrowBack size={20} />
                        <span>Back to Login</span>
                    </button>
                    
                    <div className="font-bold text-center text-[30px] m-2 mt-12">Forgot password</div>
                    <div className="mb-8 text-center text-[14px]">Enter your email to receive a password reset link</div>
                    <form className="w-full flex flex-col gap-7 text-[15px]" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <label className="text-left font-semibold">Email</label>
                            <input className="bg-white text-black px-4 py-2 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2
                                [color-scheme:light] appearance-none" 
                            id="email" name="email" placeholder='Enter email' type="email" required maxLength={MAX_EMAIL_LENGTH} 
                            onChange={(e) => setEmail(e.target.value)}></input>
                            
                            <div className="h-16 mt-2 flex items-center justify-center">
                                {error && (
                                    <p className="text-error text-sm text-center">{error}</p>
                                )}
                                {message && (
                                    <div className="flex items-center gap-3 w-full p-3 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md">
                                        <FaCheckCircle size={20} className="flex-shrink-0" />
                                        <p>{message}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit" className="bg-launch p-3 tracking-wider text-white rounded-md 
                        shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-[#2A3953]">SEND</button>
                    </form>

                </div>
            </div>
        )}
        </>
    )
}