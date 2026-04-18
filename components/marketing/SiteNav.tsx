'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';

type SolutionLink = { name: string; href: string; description: string };

const SOLUTIONS: SolutionLink[] = [
  {
    name: 'For Businesses',
    href: '/for-businesses',
    description: 'Verify technicians and manage team compliance at scale.',
  },
  {
    name: 'For Suppliers',
    href: '/for-suppliers',
    description: 'Verify buyers and track refrigerant sales with NOU oversight.',
  },
];

const PRIMARY_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Membership', href: '/membership' },
  { name: 'Training', href: '/training' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(72);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const solutionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setNavHeight(entry.contentRect.height);
    });
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSolutionsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setSolutionsOpen(false);
  }, [pathname]);

  const navClass = scrolled
    ? 'fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/90 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_20px_-6px_rgba(0,0,0,0.08)] py-3'
    : 'fixed w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-sm py-4';

  const solutionsActive = SOLUTIONS.some((s) => pathname === s.href);

  const openSolutions = () => {
    if (solutionsTimer.current) clearTimeout(solutionsTimer.current);
    setSolutionsOpen(true);
  };
  const closeSolutions = () => {
    if (solutionsTimer.current) clearTimeout(solutionsTimer.current);
    solutionsTimer.current = setTimeout(() => setSolutionsOpen(false), 120);
  };

  return (
    <>
      <nav ref={navRef} className={navClass} aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
              aria-label="HEVACRAZ home"
            >
              <ShieldCheck
                className="h-8 w-8 transition-transform duration-300 group-hover:-rotate-6"
                style={{ color: '#1C1917' }}
              />
              <div className="ml-3 leading-none">
                <span
                  className="block text-lg sm:text-xl font-bold tracking-tight transition-colors duration-200 group-hover:text-[#D97706]"
                  style={{ color: '#1C1917' }}
                >
                  HEVACRAZ
                </span>
                <p className="mt-1 hidden sm:block text-[11px] text-gray-500 tracking-wide">
                  HVAC-R Professionals Zimbabwe
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {PRIMARY_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative font-medium text-sm px-3 py-2 rounded-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 ${
                      active ? 'text-[#1C1917]' : 'text-[#1C1917]/80 hover:text-[#1C1917]'
                    }`}
                  >
                    {link.name}
                    <span
                      className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-[2px] transition-all duration-300 ${
                        active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                      }`}
                      style={{ backgroundColor: '#D97706', transformOrigin: 'left' }}
                    />
                  </Link>
                );
              })}

              {/* Solutions dropdown */}
              <div className="relative" onMouseEnter={openSolutions} onMouseLeave={closeSolutions}>
                <button
                  type="button"
                  onClick={() => setSolutionsOpen((v) => !v)}
                  aria-expanded={solutionsOpen}
                  aria-haspopup="menu"
                  className={`group relative inline-flex items-center gap-1 font-medium text-sm px-3 py-2 rounded-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 ${
                    solutionsActive || solutionsOpen ? 'text-[#1C1917]' : 'text-[#1C1917]/80 hover:text-[#1C1917]'
                  }`}
                >
                  Solutions
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      solutionsOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span
                    className={`pointer-events-none absolute left-3 right-7 -bottom-0.5 h-[2px] transition-all duration-300 ${
                      solutionsActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                    style={{ backgroundColor: '#D97706', transformOrigin: 'left' }}
                  />
                </button>

                {solutionsOpen && (
                  <div
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-80 bg-white border border-[#E7E5E4] shadow-lg py-2 animate-[slideDown_180ms_ease-out]"
                  >
                    {SOLUTIONS.map((s) => {
                      const active = pathname === s.href;
                      return (
                        <Link
                          key={s.href}
                          href={s.href}
                          role="menuitem"
                          aria-current={active ? 'page' : undefined}
                          className="group flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#FAFAF9] focus-visible:outline-none focus-visible:bg-[#FAFAF9]"
                          onClick={() => setSolutionsOpen(false)}
                        >
                          <span className="mt-1 shrink-0 p-1.5" style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                          <span className="flex-1">
                            <span
                              className={`block font-semibold tracking-tight ${
                                active ? 'text-[#D97706]' : 'text-[#1C1917]'
                              }`}
                            >
                              {s.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500 leading-snug">
                              {s.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right CTAs (desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/login"
                className="font-medium text-sm px-3 py-2 rounded-sm transition-colors text-[#1C1917]/90 hover:text-[#1C1917] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
              <Link
                href="/join"
                className="group inline-flex items-center gap-1.5 font-semibold py-2.5 px-5 text-sm text-white transition-all duration-200 shadow-sm hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ backgroundColor: '#D97706' }}
              >
                Join Now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-3 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
                style={{ color: '#1C1917' }}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="lg:hidden fixed left-0 right-0 z-50 bg-white border-t overflow-y-auto animate-[slideDown_220ms_ease-out]"
            style={{ top: navHeight, maxHeight: `calc(100vh - ${navHeight}px)` }}
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="max-w-7xl mx-auto px-4 py-2">
              <ul className="divide-y divide-gray-100">
                {PRIMARY_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between py-4 font-medium text-base transition-colors ${
                          active ? 'text-[#D97706]' : 'text-[#1C1917]'
                        }`}
                      >
                        <span>{link.name}</span>
                        <ArrowRight className={`h-4 w-4 ${active ? 'text-[#D97706]' : 'text-gray-300'}`} />
                      </Link>
                    </li>
                  );
                })}
                <li className="py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mt-1 mb-1">
                    Solutions
                  </p>
                  <ul className="space-y-1">
                    {SOLUTIONS.map((s) => {
                      const active = pathname === s.href;
                      return (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between py-3 text-base transition-colors ${
                              active ? 'text-[#D97706] font-medium' : 'text-[#1C1917]/90'
                            }`}
                          >
                            <span>{s.name}</span>
                            <ArrowRight className={`h-4 w-4 ${active ? 'text-[#D97706]' : 'text-gray-300'}`} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
                <li>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 font-medium text-base text-[#1C1917]"
                  >
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                </li>
              </ul>

              <div className="mt-3 grid grid-cols-1 gap-3 pb-5">
                <Link
                  href="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full font-semibold py-4 px-5 text-base text-white transition-all shadow-sm hover:brightness-110"
                  style={{ backgroundColor: '#D97706' }}
                >
                  Join HEVACRAZ
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/supplier-register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center font-medium py-3 px-5 text-sm border transition-colors hover:bg-[#FAFAF9] text-gray-600"
                  style={{ borderColor: '#E5E0DB' }}
                >
                  Register as Supplier
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
