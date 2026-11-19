'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeOpen } from '@fortawesome/free-regular-svg-icons';
import { useSearchParams} from 'next/navigation';
import { AuthServices } from '@/lib/authServices';
import { Suspense, useEffect, useState } from 'react';
import AppLoading from '@/app/components/AppLoading';

export default function Verify() {
    return (
        <Suspense fallback={<AppLoading />}>
            <VerifyContent />
        </Suspense>
    );
}

function VerifyContent() {

    const searchParams = useSearchParams();
    const email = searchParams?.get('email');

    const [mounted, setMounted] = useState(false);
    const [cooldown, setCoolDown] = useState(60);

    const handleResend = async () => {
        if (cooldown === 0) {
        const auth = new AuthServices();
        try{
            await auth.resendConfirmation(email);
        }
        catch (error: any) {
            console.log("Failed to resend email confirmation.")
        }
        setCoolDown(60);
        }
    }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sets cool down for resending confirmation email
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCoolDown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown])

    return(
        <div className="h-screen flex items-center justify-center">
            {mounted && (
                <div className="flex flex-col bg-white text-black p-20 shadow-lg rounded-xl items-center">
                    <div className="font font-semibold text-[40px] tracking-widest m-2">Verify Your Email</div>
                    <div>We&apos;ve sent a confirmation link to your email. Please check your inbox and click the link to activate your account</div>
                
                        <FontAwesomeIcon
                            bounce
                            icon={faEnvelopeOpen}
                            className="text-blue-300 text-[200px] mt-14 mb-8 fa-bounce-soft"
                        />
                
                    <button className={`text-white text-[20px] rounded-md pr-10 pl-10 pt-1 pb-1 tracking-wider ${cooldown > 0 ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
                    onClick={handleResend}>{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}</button>
                </div>
            )}
        </div>
    )
}