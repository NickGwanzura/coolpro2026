'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Facebook, Linkedin, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative text-white" style={{ backgroundColor: '#1C1917' }}>
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center group">
              <ShieldCheck className="h-8 w-8 text-white transition-transform duration-300 group-hover:-rotate-6" />
              <span className="ml-3 text-xl font-bold tracking-tight">HEVACRAZ</span>
            </Link>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-sm">
              Advance the HVAC-R profession in Zimbabwe through education, certification, and advocacy.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold mb-4 uppercase tracking-[0.2em] text-white/60">
              Navigate
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/about', label: 'About' },
                { href: '/membership', label: 'Membership' },
                { href: '/training', label: 'Training' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span>{l.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold mb-4 uppercase tracking-[0.2em] text-white/60">
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/faq', label: 'FAQ' },
                { href: '/for-businesses', label: 'For Businesses' },
                { href: '/for-suppliers', label: 'For Suppliers' },
                { href: '/login', label: 'Portal Login' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span>{l.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold mb-4 uppercase tracking-[0.2em] text-white/60">
              Connect
            </h4>
            <div className="flex gap-2 mb-5">
              <a
                href="#"
                aria-label="Facebook"
                className="p-2.5 bg-white/5 hover:bg-[#D97706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="WhatsApp"
                className="inline-flex items-center justify-center w-[36px] h-[36px] bg-white/5 hover:bg-[#D97706] transition-colors text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
              >
                WA
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="p-2.5 bg-white/5 hover:bg-[#D97706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>

            {subscribed ? (
              <div className="flex items-start gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>You&apos;re subscribed. We&apos;ll be in touch.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-inset"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="shrink-0 px-4 py-2.5 text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
                  style={{ backgroundColor: '#D97706' }}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {year} HEVACRAZ. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
