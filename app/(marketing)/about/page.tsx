'use client';

import {
  Award,
  FileCheck,
  Search,
  Calculator,
  GraduationCap,
  Gift,
  ShieldCheck,
  Users,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const MEMBER_BENEFITS = [
  {
    icon: <Award className="h-5 w-5" />,
    title: 'Legal recognition',
    body: 'NOU-aligned certification that satisfies Zimbabwean refrigerant-handling law and EPR audits.',
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: 'COC issuance',
    body: 'Issue Certificates of Conformity directly from the platform. No paper, no middleman.',
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: 'Discoverability',
    body: 'Public, searchable registry profile. Businesses verify you before awarding contracts.',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'Professional tools',
    body: 'Sizing calculators, field toolkits, and job logging. Priced for a membership, not per seat.',
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: 'Continuing education',
    body: 'Learning Hub, exam marking, and CPD credits that stack toward higher-tier certifications.',
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: 'Rewards & discounts',
    body: 'Earn points on compliant work. Redeem for tools, training, and supplier vouchers.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Supplier protection',
    body: 'Gas suppliers verify your certification before sale, stopping counterfeit and improper dispensing.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Community & referrals',
    body: 'Network of 500+ verified technicians, trainers, and lecturers across all ten provinces.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I went from informal repairs to certified COC issuer in 6 months. Now I train three apprentices.',
    name: 'Tendai M.',
    company: 'Cold Solutions Harare',
    location: 'Harare',
    memberSince: '2021',
    cocIssued: 47,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
  {
    quote: 'The registry gave me credibility I never had. My business grew 300% in year one.',
    name: 'Chenai S.',
    company: 'CoolTech Zimbabwe',
    location: 'Bulawayo',
    memberSince: '2020',
    cocIssued: 156,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  },
  {
    quote: 'HEVACRAZ training helped me win government contracts. The certification is worth every penny.',
    name: 'Farai K.',
    company: 'Industrial Cooling Systems',
    location: 'Mutare',
    memberSince: '2019',
    cocIssued: 203,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {/* Page header */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 relative overflow-hidden" style={{ backgroundColor: '#FAFAF9' }}>
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, #D97706, transparent 70%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-4">About HEVACRAZ</p>
          <h1 className="text-[2.25rem] sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]" style={{ color: '#1C1917' }}>
            Real outcomes, measured in
            <br className="hidden sm:block" />{' '}
            <span className="text-[#D97706]">work won</span> and{' '}
            <span className="text-[#5A7D5A]">compliance earned.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 leading-relaxed text-base sm:text-lg">
            HEVACRAZ membership is not a badge. It&rsquo;s a toolkit, a registry, and a regulatory
            shortcut that together move technicians from informal repair work into audited,
            certified, higher-paying jobs.
          </p>
        </div>
      </section>

      {/* How Members Benefit */}
      <section className="py-20 sm:py-24 relative" style={{ backgroundColor: '#1C1917' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 mb-14">
            <div className="lg:col-span-1 lg:sticky lg:top-28 lg:self-start">
              <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-4">
                Why Members Join
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
                Eight outcomes that change your career trajectory.
              </h2>
              <p className="text-white/60 mt-5 leading-relaxed">
                From certification to supplier protection, every benefit is designed to move the
                needle on income, compliance, and reputation.
              </p>
              <Link
                href="/membership"
                className="group mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
                style={{ backgroundColor: '#D97706' }}
              >
                See Membership Plans
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {MEMBER_BENEFITS.map((item, i) => (
                <div
                  key={i}
                  className="group p-5 sm:p-6 border border-white/10 transition-all duration-300 hover:bg-white/[0.06] hover:border-[#D97706]/30 hover:-translate-y-0.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="shrink-0 p-2 transition-colors duration-300 group-hover:bg-[#D97706]/25"
                      style={{ backgroundColor: 'rgba(217,119,6,0.15)', color: '#D97706' }}
                    >
                      {item.icon}
                    </div>
                    <h3 className="text-base font-bold text-white pt-1 tracking-tight">{item.title}</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-t border-white/10 pt-10 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: '3.2×', l: 'Avg income lift' },
              { v: '48%', l: 'More repeat clients' },
              { v: '90 days', l: 'To first COC issuance' },
              { v: '$7', l: 'Student entry price' },
            ].map((s) => (
              <div key={s.l} className="group">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight transition-colors duration-300 group-hover:text-[#D97706]">
                  {s.v}
                </p>
                <p className="mt-2 text-[11px] sm:text-xs text-white/50 uppercase tracking-[0.18em]">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Success Stories */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">
              In their own words
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight" style={{ color: '#1C1917' }}>
              Member Success Stories
            </h2>
            <div className="w-20 h-[3px] mx-auto mt-5" style={{ backgroundColor: '#D97706' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {TESTIMONIALS.map((member, index) => (
              <article
                key={index}
                className="group bg-white border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: '#E7E5E4' }}
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.company}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-bold text-lg tracking-tight">{member.name}</p>
                    <p className="text-sm text-white/85">{member.company}</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-6 leading-relaxed italic">&ldquo;{member.quote}&rdquo;</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Member since</p>
                      <p className="font-semibold mt-0.5" style={{ color: '#1C1917' }}>
                        {member.memberSince}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">COCs issued</p>
                      <p className="font-bold text-lg mt-0.5" style={{ color: '#D97706' }}>
                        {member.cocIssued}
                      </p>
                    </div>
                  </div>
                  <button className="group/btn mt-5 w-full inline-flex items-center justify-center gap-1.5 text-center text-sm font-medium transition-colors" style={{ color: '#5A7D5A' }}>
                    View {member.name.split(' ')[0]}&rsquo;s Registry Profile
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Stats bar */}
          <div className="py-10 sm:py-12 px-6 relative overflow-hidden" style={{ backgroundColor: '#1C1917' }}>
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)' }}
            />
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">500+</p>
                <p className="mt-2 text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                  Certified Technicians
                </p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">1,200+</p>
                <p className="mt-2 text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                  COCs Issued
                </p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">3,000+</p>
                <p className="mt-2 text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                  Jobs Logged
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
