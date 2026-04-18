'use client';

import Link from 'next/link';
import { ShieldCheck, Award, Wrench, User, CheckCircle, ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const BENEFITS = [
  {
    icon: <Award className="h-8 w-8" />,
    title: 'Industry Certification',
    description: 'Get recognized credentials that meet Zimbabwean and international standards',
  },
  {
    icon: <Wrench className="h-8 w-8" />,
    title: 'Exclusive Tools',
    description: 'Access COC request system, sizing calculators, and job logging tools',
  },
  {
    icon: <User className="h-8 w-8" />,
    title: 'Public Registry',
    description: 'Get listed in our verified technician database for client discovery',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1920&h=1080&fit=crop"
            alt="Zimbabwean HVAC technician at work"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#D97706]/10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40">
          <div className="max-w-3xl">
            <p className="text-[#D97706] text-sm font-semibold tracking-widest uppercase mb-6">
              Since 2018 &nbsp;·&nbsp; 500+ Certified Technicians
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
              The Future of<br />HVAC-R in Zimbabwe
            </h1>
            <p className="text-white/70 text-lg sm:text-xl mb-10 leading-relaxed max-w-xl">
              Professional training, compliance, and industry networking built for Zimbabwe&apos;s refrigeration and air-conditioning sector.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-block font-semibold py-4 px-8 text-base text-white text-center transition-colors duration-200"
                style={{ backgroundColor: '#D97706' }}
              >
                Enter Platform →
              </Link>
              <Link
                href="/verify-technician"
                className="inline-block border border-white/50 hover:border-white hover:bg-white/10 text-white font-medium py-4 px-8 text-base text-center transition-colors duration-200"
              >
                Verify a Technician
              </Link>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-wrap gap-8 text-xs font-medium text-white/60 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D97706] shrink-0" /> SAZ Recognized
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

      {/* Benefit teaser 3 cards */}
      <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1C1917' }}>
              Everything You Need to Advance
            </h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: '#D97706' }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, index) => (
              <div
                key={index}
                className="p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border"
                style={{ backgroundColor: 'white', borderColor: '#E5E0DB' }}
              >
                <div className="p-4 inline-block mb-6" style={{ backgroundColor: '#FAFAF9' }}>
                  <span style={{ color: '#5A7D5A' }}>{benefit.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#1C1917' }}>{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Section CTAs */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/about"
              className="flex items-center justify-between px-6 py-4 border font-semibold text-sm transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E0DB', color: '#1C1917' }}
            >
              Why Members Join
              <ArrowRight className="h-4 w-4" style={{ color: '#D97706' }} />
            </Link>
            <Link
              href="/membership"
              className="flex items-center justify-between px-6 py-4 border font-semibold text-sm transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E0DB', color: '#1C1917' }}
            >
              See Pricing
              <ArrowRight className="h-4 w-4" style={{ color: '#D97706' }} />
            </Link>
            <Link
              href="/training"
              className="flex items-center justify-between px-6 py-4 border font-semibold text-sm transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E0DB', color: '#1C1917' }}
            >
              Browse Training
              <ArrowRight className="h-4 w-4" style={{ color: '#D97706' }} />
            </Link>
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
