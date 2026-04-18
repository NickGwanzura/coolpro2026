'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Search, Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Membership', href: '/membership' },
  { name: 'Training', href: '/training' },
  { name: 'For Businesses', href: '/for-businesses' },
  { name: 'For Suppliers', href: '/for-suppliers' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navClass = scrolled
    ? 'fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/90 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_20px_-6px_rgba(0,0,0,0.08)] py-3'
    : 'fixed w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-sm py-4';

  return (
    <>
      <nav className={navClass} aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
            >
              <ShieldCheck
                className="h-8 w-8 transition-transform duration-300 group-hover:-rotate-6"
                style={{ color: '#1C1917' }}
              />
              <div className="ml-3 leading-none">
                <span className="block text-lg sm:text-xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
                  HEVACRAZ
                </span>
                <p className="mt-1 text-[11px] sm:text-xs text-gray-500 tracking-wide">
                  HVAC-R Professionals Zimbabwe
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center gap-0.5">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative font-medium text-sm px-3 py-2 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 ${
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
              </div>
            </div>

            {/* Right CTAs (desktop) */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="group font-medium text-sm px-3 py-2 rounded-sm transition-colors text-[#1C1917]/90 hover:text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
              >
                Member Login{' '}
                <ArrowRight className="inline h-3.5 w-3.5 ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="p-2 hover:bg-gray-100 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ color: '#1C1917' }}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 font-semibold py-2.5 px-5 text-sm text-white transition-all duration-200 shadow-sm hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ backgroundColor: '#D97706' }}
              >
                Join Now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/supplier-register"
                className="font-semibold py-2.5 px-5 text-sm border transition-all duration-200 hover:bg-[#FAFAF9] hover:border-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ borderColor: '#D4A574', color: '#1C1917', backgroundColor: 'white' }}
              >
                Register as Supplier
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="p-3 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
                style={{ color: '#1C1917' }}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
              >
                <Search className="h-5 w-5" />
              </button>
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

        {/* Search overlay */}
        {searchOpen && (
          <div
            className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 px-4 py-5 animate-[slideDown_180ms_ease-out]"
            role="search"
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search technicians, services, COCs..."
                  className="w-full pl-12 pr-16 py-3.5 border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-shadow"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-mono text-gray-400 border border-gray-200 bg-gray-50">
                  Esc
                </kbd>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Try &ldquo;Harare&rdquo;, &ldquo;R-32&rdquo;, or a technician name.
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile drawer (outside nav so backdrop works) */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="lg:hidden fixed top-[72px] left-0 right-0 z-50 bg-white border-t max-h-[calc(100vh-72px)] overflow-y-auto animate-[slideDown_220ms_ease-out]"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <ul className="divide-y divide-gray-100">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
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
                <li>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 font-medium text-base text-[#1C1917]"
                  >
                    <span>Member Login</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                </li>
              </ul>

              <div className="mt-4 grid grid-cols-1 gap-3 pb-4">
                <Link
                  href="/login"
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
                  className="w-full text-center font-semibold py-4 px-5 text-base border transition-colors hover:bg-[#FAFAF9]"
                  style={{ borderColor: '#D4A574', color: '#1C1917', backgroundColor: 'white' }}
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
