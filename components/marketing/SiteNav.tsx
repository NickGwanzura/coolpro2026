'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Search, Menu, X } from 'lucide-react';

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
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-white shadow-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <ShieldCheck className="h-8 w-8" style={{ color: '#1C1917' }} />
            <div className="ml-3">
              <span className="text-xl font-bold" style={{ color: '#1C1917' }}>HEVACRAZ</span>
              <p className="text-xs text-gray-500">HVAC-R Professionals Zimbabwe</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium text-sm px-3 py-2 transition-colors hover:bg-gray-100 ${
                  pathname === link.href ? 'border-b-2 border-[#D97706]' : ''
                }`}
                style={{ color: '#1C1917' }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/login"
              className="font-medium text-sm transition-colors hover:opacity-80 px-3 py-2"
              style={{ color: '#1C1917' }}
            >
              Member Login →
            </Link>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 transition-colors"
              style={{ color: '#1C1917' }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/login"
              className="font-semibold py-2 px-5 transition-all duration-300 text-sm text-white"
              style={{ backgroundColor: '#D97706' }}
            >
              Join Now →
            </Link>
            <Link
              href="/supplier-register"
              className="font-semibold py-2 px-5 transition-all duration-300 text-sm border"
              style={{ borderColor: '#D4A574', color: '#1C1917', backgroundColor: 'white' }}
            >
              Register as Supplier
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 transition-colors"
              style={{ color: '#1C1917' }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search technicians, services, COCs..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block font-medium py-2 text-lg transition-colors"
                style={{ color: '#1C1917' }}
              >
                {link.name}
              </Link>
            ))}
            <hr className="my-2 border-gray-200" />
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 text-lg"
              style={{ color: '#1C1917' }}
            >
              Member Login
            </Link>
            <Link
              href="/login"
              className="block w-full text-center font-semibold py-3 px-5 transition-all duration-300 text-white"
              style={{ backgroundColor: '#D97706' }}
            >
              Join HEVACRAZ
            </Link>
            <Link
              href="/supplier-register"
              className="block w-full text-center font-semibold py-3 px-5 transition-all duration-300 border mt-2"
              style={{ borderColor: '#D4A574', color: '#1C1917', backgroundColor: 'white' }}
            >
              Register as Supplier
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
