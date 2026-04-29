'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Factory,
  Wrench,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

type JoinPath = {
  slug: 'student' | 'technician' | 'supplier' | 'business';
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  price: string;
  priceNote: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  accent: string;
  accentBg: string;
};

const PATHS: JoinPath[] = [
  {
    slug: 'student',
    eyebrow: 'Polytechnic Students',
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Student',
    price: '$7',
    priceNote: '/ year',
    blurb:
      'For students currently enrolled at a recognised Polytechnic in Zimbabwe studying HVAC-R or refrigeration.',
    features: [
      'Polytechnic ID verification',
      'Learning Hub access',
      'Sizing tool & field toolkit',
      'Entry-level certification path',
      'Discounted training sessions',
    ],
    cta: 'Verify & Join',
    href: '/join/student',
    accent: '#5A7D5A',
    accentBg: 'rgba(90,125,90,0.1)',
  },
  {
    slug: 'technician',
    eyebrow: 'Certified Technicians',
    icon: <Wrench className="h-6 w-6" />,
    title: 'Technician',
    price: 'Apply',
    priceNote: 'verification required',
    blurb:
      'For working refrigeration and HVAC technicians. Get listed on the national verification registry so businesses and clients can confirm your credentials.',
    features: [
      'Public registry listing',
      'Credential verification',
      'Job leads from verified buyers',
      'Refrigerant handling permits',
      'CPD and renewal reminders',
    ],
    cta: 'Register as Technician',
    href: '/join/technician',
    accent: '#1E40AF',
    accentBg: 'rgba(30,64,175,0.10)',
  },
  {
    slug: 'supplier',
    eyebrow: 'Refrigerant Suppliers',
    icon: <Factory className="h-6 w-6" />,
    title: 'Supplier',
    price: 'Apply',
    priceNote: 'approval required',
    blurb:
      'For registered gas suppliers selling regulated refrigerants. HEVACRAZ + NOU approval is required before you can transact on the platform.',
    features: [
      'Verify buyer before sale',
      'Two-step NOU-approved reorders',
      'Audit-trailed sales log',
      'Public supplier directory listing',
      'Compliance burden lifted',
    ],
    cta: 'Register as Supplier',
    href: '/supplier-register',
    accent: '#D97706',
    accentBg: 'rgba(217,119,6,0.1)',
  },
  {
    slug: 'business',
    eyebrow: 'Businesses & Enterprises',
    icon: <Building2 className="h-6 w-6" />,
    title: 'Business',
    price: 'Custom',
    priceNote: 'per team size',
    blurb:
      'For companies hiring certified technicians, managing team credentials, and aligning with NOU refrigerant regulations at scale.',
    features: [
      'Verify any technician in seconds',
      'Bulk certification management',
      'Team CPD tracking',
      'API access for embedded verification',
      'Dedicated account contact',
    ],
    cta: 'Talk to Enterprise Sales',
    href: '/contact?topic=enterprise',
    accent: '#1C1917',
    accentBg: 'rgba(28,25,23,0.08)',
  },
];

export default function JoinPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-14 sm:pb-16 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[240px] opacity-[0.08] pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #D97706, transparent 70%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">
            Join HEVACRAZ
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]" style={{ color: '#1C1917' }}>
            Which path fits you?
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Three registration tracks, each tuned to a different role in the refrigeration ecosystem.
            Pick yours to get started.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4" style={{ color: '#5A7D5A' }} />
            Already a member?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#D97706' }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Three paths */}
      <section className="pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
            {PATHS.map((p) => (
              <div
                key={p.slug}
                className="group relative flex flex-col p-7 sm:p-8 border-2 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div
                  className="inline-flex items-center gap-2 self-start p-2 mb-5"
                  style={{ backgroundColor: p.accentBg, color: p.accent }}
                >
                  {p.icon}
                </div>

                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: p.accent }}>
                  {p.eyebrow}
                </p>

                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight mt-2"
                  style={{ color: '#1C1917' }}
                >
                  {p.title}
                </h2>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
                    {p.price}
                  </p>
                  <span className="text-sm text-gray-500">{p.priceNote}</span>
                </div>

                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{p.blurb}</p>

                <div className="my-6 h-px bg-gray-100" />

                <ul className="space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: p.accent }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className="group/btn mt-8 inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 font-semibold transition-all duration-200 text-white shadow-sm hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: p.accent, outlineColor: p.accent }}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500 max-w-xl mx-auto">
            Not sure which path fits? <Link href="/contact" className="font-semibold hover:underline" style={{ color: '#D97706' }}>Talk to us</Link> and we&rsquo;ll point you to the right track.
          </p>
        </div>
      </section>
    </div>
  );
}
