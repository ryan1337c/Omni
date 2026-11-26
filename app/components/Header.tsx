"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { useAuth } from '../context/AuthContext';
import { faArrowRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Menu, X, Moon, Sun } from 'lucide-react';
import ProfileMenu, { ProfileMenuItems } from './ProfileMenu';
import SettingsModal from '@/app/components/settings';
import icon from "@/public/omni-logo.png";

// Features and Demo scroll to sections on the landing page (id="features" / id="demo").
const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Demo', href: '/#demo' },
  { label: 'Pricing', href: '/pages/pricing' },
  { label: 'Contact', href: '/pages/contact' },
];

const ThemeIconButton = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 flex-shrink-0 rounded-full grid place-items-center border border-black/10 bg-white/60 text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

const Header = () => {
  const { isLoggedIn, fullName, tier } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }
    // Close the mobile menu if the window grows past the md breakpoint
    const mq = window.matchMedia('(min-width: 768px)');
    function handleBreakpoint(e: MediaQueryListEvent) {
      if (e.matches) setIsMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    mq.addEventListener('change', handleBreakpoint);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      mq.removeEventListener('change', handleBreakpoint);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  // On the landing page, scroll to the section every click and keep the URL clean.
  // From other pages, let the /#features or /#demo Link navigate; the landing page
  // consumes the hash once and strips it so a later click still works.
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    closeMenu();
    const id = href.startsWith('/#') ? href.slice(2) : '';
    if ((id !== 'features' && id !== 'demo') || pathname !== '/') return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    if (window.location.hash || window.location.search) {
      window.history.replaceState(window.history.state, '', '/');
    }
  };

  const openSettings = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(true);
  };

  const mobileItem =
    'flex items-center gap-3 w-full px-4 py-3 rounded-md font-semibold transition-colors duration-200 text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50';

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-landingPageLight/80 border-b border-black/5 text-slate-800 dark:bg-[#1e293b]/80 dark:border-white/10 dark:text-gray-300 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-[4.5rem] flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex-1 flex justify-start min-w-0">
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5">
            <img
              src={icon.src}
              alt="Omni logo"
              className="w-9 h-9 md:w-10 md:h-10 object-contain"
            />
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
              Omni
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex justify-center items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className="whitespace-nowrap transition-colors duration-300 hover:text-violet-600 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3">
          <ThemeIconButton />

          <div className="hidden md:flex items-center gap-2">
            {!mounted ? (
              <div className="flex items-center gap-2" aria-hidden>
                <span className="invisible inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold whitespace-nowrap lg:px-4">
                  <span className="inline-block h-3.5 w-3.5" />
                  Log In
                </span>
                <span className="invisible inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold whitespace-nowrap lg:px-4">
                  <span className="inline-block h-3.5 w-3.5" />
                  Sign Up
                </span>
              </div>
            ) : isLoggedIn ? (
              <ProfileMenu
                showHoverHint
                placement="bottom-right"
                onSettingsClick={openSettings}
                triggerClassName="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <FaUserCircle size={28} className="flex-shrink-0 text-slate-600 dark:text-slate-400" />
                <div className="min-w-0 text-left hidden lg:block">
                  <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-slate-800 dark:text-white">
                    {fullName ?? "Profile"}
                  </span>
                  {tier ? (
                    <span className="min-w-[4.5rem] block truncate text-xs leading-tight capitalize text-slate-500 dark:text-slate-400">
                      {tier} Plan
                    </span>
                  ) : (
                    <div
                      className="mt-0.5 h-3.5 w-[4.5rem] animate-pulse rounded bg-slate-200 dark:bg-slate-700"
                      aria-hidden
                    />
                  )}
                </div>
              </ProfileMenu>
            ) : (
              <>
                <Link
                  href="/pages/login"
                  className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-slate-700 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowRightToBracket} className="w-3.5 h-3.5" />
                  Log In
                </Link>
                <Link
                  href="/pages/register"
                  className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-white bg-[#7c3aed] dark:bg-[#6366f1] shadow-sm hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.97] transition-all"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 grid place-items-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div
              id="mobile-menu"
              className={`
                absolute top-full mt-2 right-0 w-[min(18rem,calc(100vw-2rem))] p-3 flex flex-col border
                rounded-xl shadow-xl transition-all duration-200 ease-out origin-top-right text-sm
                ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}
                bg-white border-slate-200 dark:bg-gray-900 dark:border-slate-700
              `}
            >
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={(event) => handleNavClick(event, link.href)} className={mobileItem}>
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              {!mounted ? (
                <div className="flex flex-col gap-1" aria-hidden>
                  <span className={`${mobileItem} invisible pointer-events-none`}>
                    <span className="inline-block h-3.5 w-3.5" />
                    Log In
                  </span>
                  <span className={`${mobileItem} invisible pointer-events-none`}>
                    <span className="inline-block h-3.5 w-3.5" />
                    Sign Up
                  </span>
                </div>
              ) : isLoggedIn ? (
                <ProfileMenuItems
                  onSettingsClick={openSettings}
                  onLogout={() => setIsMenuOpen(false)}
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <Link href="/pages/login" onClick={closeMenu} className={mobileItem}>
                    <FontAwesomeIcon icon={faArrowRightToBracket} className="w-3.5 h-3.5" />
                    Log In
                  </Link>
                  <Link
                    href="/pages/register"
                    onClick={closeMenu}
                    className={mobileItem}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
                    Sign Up
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