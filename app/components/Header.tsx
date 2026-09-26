"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { FaBolt, FaUserCircle} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { faArrowRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import ProfileMenu, { ProfileMenuItems } from './ProfileMenu';
import SettingsModal from '@/app/components/settings';
import icon from "@/public/omni-logo.png";

const Header = () => {
  const { isLoggedIn, tier } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  const closeMenu = () => setIsMenuOpen(false);

  const openSettings = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-landingPageLight text-black dark:bg-[#1e2b3b] dark:text-gray-300 shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        <div className="flex-1 flex justify-start">
          <Link href="/" onClick={closeMenu}>
            <div className="flex items-center gap-3 cursor-pointer">
                <img 
                  src={icon.src}
                  alt="Custome Icon"
                  className="text-white w-14 h-14 object-contain"
                />
              <span className="text-2xl font-bold ">Omni</span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/pages/pricing">
            <div className="transition-colors duration-300 font-medium hover:text-violet-600 dark:hover:text-white">Pricing</div>
          </Link>
          <Link href="/pages/contact">
            <div className="transition-colors duration-300 font-medium hover:text-violet-600 dark:hover:text-white">Contact</div>
          </Link>
        </nav>

        <div className="flex-1 flex justify-end items-center">
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <ProfileMenu
                showHoverHint
                placement="bottom-right"
                onSettingsClick={openSettings}
                triggerClassName="flex items-center gap-3 m-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <FaUserCircle size={35} className="flex-shrink-0 text-slate-600 dark:text-gray-300" />
                <div className="min-w-0 text-left hidden sm:block">
                  <span className="block truncate text-sm font-semibold text-slate-800 dark:text-gray-200">
                    Profile
                  </span>
                  <span className="min-w-[4.5rem] block truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                    {tier ?? "Loading..."}
                  </span>
                </div>
              </ProfileMenu>
            ) : (
            <div className="flex items-center gap-4">
              <Link href="/pages/login">
                <PrimaryButton variant="primary">
                  <FontAwesomeIcon icon={faArrowRightToBracket} />
                  Log In
                </PrimaryButton>
              </Link>

              <Link href="/pages/register">
                <PrimaryButton variant="outline">
                  <FontAwesomeIcon icon={faUserPlus} />
                  Sign Up
                </PrimaryButton>
              </Link>
            </div>
        )}
          </div>
          
        <div className='relative md:hidden' ref={mobileMenuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`
            md:hidden absolute top-full w-64 p-3 right-0 flex flex-col border
            rounded-lg shadow-xl transition-all duration-300 ease-out origin-top-right text-sm
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}
            bg-white border-slate-200 dark:bg-gray-900 dark:border-slate-700
          `}>
              <Link href="/pages/pricing" onClick={closeMenu}>
                <div className="text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200 text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50">
                  Pricing
                </div>
              </Link>
              <Link href="/pages/contact" onClick={closeMenu}>
                <div className="text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200 text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50">
                  Contact
                </div>
              </Link>
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              {isLoggedIn ? (
                  <ProfileMenuItems
                    onSettingsClick={openSettings}
                    onLogout={() => setIsMenuOpen(false)}
                  />
                ) : (
                <div className="flex flex-col gap-1">
                  <Link href="/pages/login" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-slate-700/50">
                      <FontAwesomeIcon icon={faArrowRightToBracket} />
                      Log In
                    </button>
                  </Link>
                  <Link href="/pages/register" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-slate-700/50">
                      <FontAwesomeIcon icon={faUserPlus} />
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
          </div>
        </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
}

export default Header;
