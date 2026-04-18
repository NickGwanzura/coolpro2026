'use client';

import Link from 'next/link';
import { Award, Wrench, User, CheckCircle, ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const BENEFITS = [
  {
    icon: <Award className="h-7 w-7" />,
    title: 'Industry Certification',
    description: 'Get recognised credentials that meet Zimbabwean and international standards.',
  },
  {
    icon: <Wrench className="h-7 w-7" />,
    title: 'Exclusive Tools',
    description: 'Access COC requests, sizing calculators, and job logging tools.',
  },
  {
    icon: <User className="h-7 w-7" />,
    title: 'Public Registry',
    description: 'Listed in our verified technician database for client discovery.',
  },
];

const SECTION_LINKS = [
  { href: '/about', label: 'Why Members Join', sub: 'Outcomes and benefits' },
  { href: '/membership', label: 'See Pricing', sub: 'Plans from $7/year' },
  { href: '/training', label: 'Browse Training', sub: 'Upcoming sessions' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Hero */}
      <section className="relative min-h-[88vh] sm:min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1920&h=1080&fit=crop"
            alt="Zimbabwean HVAC technician at work"
            className="w-full h-full object-cover object-center scale-105 motion-safe:animate-[slowZoom_24s_ease-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#D97706]/10" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 md:py-40">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-3 text-[#D97706] text-xs sm:text-sm font-semibold tracking-[0.18em] sm:tracking-[0.22em] uppercase mb-5 sm:mb-6">
              <span className="inline-block w-6 h-px bg-[#D97706]" />
              Since 2018
              <span className="opacity-40">·</span>
              500+ Certified Technicians
            </p>
            <h1 className="text-[2.5rem] leading-[1.08] sm:text-6xl md:text-7xl font-bold text-white mb-5 sm:mb-6 tracking-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-white via-white to-[#f5b66b] bg-clip-text text-transparent">
                HVAC-R in Zimbabwe
              </span>
            </h1>
            <p className="text-white/75 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 leading-relaxed max-w-xl">
              Professional training, compliance, and industry networking built for Zimbabwe&apos;s refrigeration and air-conditioning sector.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 font-semibold py-4 px-8 text-base text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:brightness-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ backgroundColor: '#D97706' }}
              >
                Enter Platform
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/verify-technician"
                className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white hover:bg-white/10 text-white font-medium py-4 px-8 text-base transition-colors duration-200 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Verify a Technician
              </Link>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 backdrop-blur-sm bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] sm:text-xs font-medium text-white/70 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D97706] shrink-0" /> SAZ Recognised
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D97706] shrink-0" /> Government Compliant
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D97706] shrink-0" /> Industry Leading
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit teaser */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">
              What you get
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight" style={{ color: '#1C1917' }}>
              Everything You Need to Advance
            </h2>
            <div className="w-20 h-[3px] mx-auto mt-5" style={{ backgroundColor: '#D97706' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {BENEFITS.map((benefit, index) => (
              <div
                key={index}
                className="group relative p-7 sm:p-8 bg-white border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#D97706]/40"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div
                  className="inline-flex p-3.5 mb-6 transition-colors duration-300 group-hover:bg-[#D97706]/10"
                  style={{ backgroundColor: '#FAFAF9' }}
                >
                  <span className="transition-colors duration-300 group-hover:text-[#D97706]" style={{ color: '#5A7D5A' }}>
                    {benefit.icon}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 tracking-tight" style={{ color: '#1C1917' }}>
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Section CTAs */}
          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {SECTION_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border transition-all duration-200 hover:bg-[#FAFAF9] hover:border-[#D97706]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ borderColor: '#E5E0DB' }}
              >
                <span className="flex flex-col">
                  <span className="font-semibold text-sm" style={{ color: '#1C1917' }}>{l.label}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{l.sub}</span>
                </span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: '#D97706' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
