'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  GraduationCap,
  Sparkles,
  UserRoundCheck,
  Wrench,
} from 'lucide-react';

type JoinPath = {
  slug: 'student' | 'technician' | 'supplier';
  label: string;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  audience: string;
  outcome: string;
  timeline: string;
  proof: string;
  features: string[];
  cta: string;
  href: string;
  accent: string;
  accentSoft: string;
  border: string;
};

const PATHS: JoinPath[] = [
  {
    slug: 'student',
    label: 'Student',
    eyebrow: 'Learning track',
    icon: <GraduationCap className="h-5 w-5" />,
    title: 'Start as a Polytechnic student',
    audience: 'For enrolled HVAC-R, refrigeration, electrical, mechanical, and building services students.',
    outcome: 'Unlock learning tools, field references, discounted sessions, and an entry-level certification path.',
    timeline: 'Usually reviewed within 2 working days',
    proof: 'Student ID or enrolment proof',
    features: ['Learning Hub access', 'Field toolkit basics', 'Student registry status'],
    cta: 'Join as Student',
    href: '/join/student',
    accent: '#5A7D5A',
    accentSoft: 'rgba(90,125,90,0.12)',
    border: 'rgba(90,125,90,0.28)',
  },
  {
    slug: 'technician',
    label: 'Technician',
    eyebrow: 'Registry track',
    icon: <Wrench className="h-5 w-5" />,
    title: 'Get verified as a working technician',
    audience: 'For HVAC-R and refrigeration technicians who need a public, QR-verifiable credential.',
    outcome: 'Appear in the national registry and use digital tools for jobs, COCs, permits, and refrigerant handling.',
    timeline: 'Credential review after submission',
    proof: 'National ID, experience, certificates',
    features: ['Public verification listing', 'COC request workflow', 'CPD and renewal tracking'],
    cta: 'Register as Technician',
    href: '/join/technician',
    accent: '#1E40AF',
    accentSoft: 'rgba(30,64,175,0.10)',
    border: 'rgba(30,64,175,0.24)',
  },
  {
    slug: 'supplier',
    label: 'Supplier',
    eyebrow: 'Compliance track',
    icon: <Factory className="h-5 w-5" />,
    title: 'Register a refrigerant supplier',
    audience: 'For approved businesses selling regulated refrigerants into the Zimbabwe market.',
    outcome: 'Verify buyers before sale, submit reorders for review, and maintain auditable compliance records.',
    timeline: 'HEVACRAZ + NOU approval required',
    proof: 'Company, tax, and licence details',
    features: ['Buyer verification', 'Two-stage reorder approval', 'Supplier ledger reporting'],
    cta: 'Register Supplier',
    href: '/supplier-register',
    accent: '#D97706',
    accentSoft: 'rgba(217,119,6,0.12)',
    border: 'rgba(217,119,6,0.28)',
  },
];

const STEPS = [
  {
    icon: <UserRoundCheck className="h-5 w-5" />,
    title: 'Choose your role',
    body: 'Each path asks only for the evidence needed to verify that role.',
  },
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: 'Submit proof',
    body: 'Your application joins the HEVACRAZ review queue with a reference number.',
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    title: 'Get activated',
    body: 'Approved accounts unlock the right dashboard, tools, and registry status.',
  },
];

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <section className="relative overflow-hidden bg-[#111827] pt-28 text-white sm:pt-32">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1800&h=1100&fit=crop"
            alt="HVAC technician servicing refrigeration equipment"
            fill
            unoptimized
            sizes="100vw"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/55" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FAFAF9] to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-16">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#F5B66B]" />
              Join HEVACRAZ
            </div>
            <h1 className="text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Choose the right entry point into Zimbabwe&apos;s refrigerant compliance system.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/72">
              Students, technicians, and suppliers each need a different verification path. Pick the role that matches you and the platform will route your application to the right review queue.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#join-paths"
                className="inline-flex items-center justify-center gap-2 bg-[#D97706] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B66B]"
              >
                Compare join paths
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border border-white/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Already approved? Sign in
              </Link>
            </div>
          </div>

        </div>
      </section>

      <section id="join-paths" className="relative -mt-10 pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {PATHS.map((path) => (
              <article
                key={path.slug}
                className="flex min-h-full flex-col border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-6"
                style={{ borderColor: path.border }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold"
                    style={{ backgroundColor: path.accentSoft, color: path.accent }}
                  >
                    {path.icon}
                    {path.label}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {path.eyebrow}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#1C1917]">{path.title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">{path.audience}</p>

                <div className="mt-5 border-y border-gray-100 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">What you unlock</p>
                  <p className="mt-2 text-sm leading-6 text-[#44403C]">{path.outcome}</p>
                </div>

                <div className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="bg-[#FAFAF9] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Review</p>
                    <p className="mt-1 text-sm font-semibold text-[#1C1917]">{path.timeline}</p>
                  </div>
                  <div className="bg-[#FAFAF9] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Proof</p>
                    <p className="mt-1 text-sm font-semibold text-[#1C1917]">{path.proof}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {path.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: path.accent }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Link
                    href={path.href}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: path.accent }}
                  >
                    {path.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 border-y border-[#E5E0DB] py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D97706]">What happens next</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1917]">A short review process, then the right dashboard opens.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.title} className="bg-white p-5 shadow-sm">
                  <div className="mb-4 inline-flex bg-[#F5F5F4] p-2 text-[#D97706]">{step.icon}</div>
                  <h3 className="text-sm font-bold text-[#1C1917]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 bg-[#1C1917] p-6 text-white sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold">Not sure which path fits?</p>
              <p className="mt-1 text-sm text-white/65">Send a note and HEVACRAZ can route you to the correct application.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-bold text-[#1C1917] transition hover:bg-[#F5F5F4]"
            >
              Contact the team
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
