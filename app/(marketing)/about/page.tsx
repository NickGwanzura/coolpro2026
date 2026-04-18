'use client';

import { Award, FileCheck, Search, Calculator, GraduationCap, Gift, ShieldCheck, Users } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const MEMBER_BENEFITS = [
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Legal recognition',
    body: 'NOU-aligned certification that satisfies Zimbabwean refrigerant-handling law and EPR audits.',
  },
  {
    icon: <FileCheck className="h-6 w-6" />,
    title: 'COC issuance',
    body: 'Issue Certificates of Conformity directly from the platform no paper, no middleman.',
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: 'Discoverability',
    body: 'Public, searchable registry profile. Businesses verify you before awarding contracts.',
  },
  {
    icon: <Calculator className="h-6 w-6" />,
    title: 'Professional tools',
    body: 'Sizing calculators, field toolkits, job logging priced for a membership, not per seat.',
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Continuing education',
    body: 'Learning Hub, exam marking, and CPD credits that stack toward higher-tier certifications.',
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: 'Rewards & discounts',
    body: 'Earn points on compliant work; redeem for tools, training, and supplier vouchers.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Supplier protection',
    body: 'Gas suppliers verify your certification before sale stops counterfeit and improper dispensing.',
  },
  {
    icon: <Users className="h-6 w-6" />,
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
      <div className="pt-28 pb-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-3">About HEVACRAZ</p>
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: '#1C1917' }}>
            Real outcomes, measured in<br />work won and compliance earned.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 leading-relaxed text-lg">
            HEVACRAZ membership is not a badge it&rsquo;s a toolkit, a registry, and a
            regulatory shortcut that together move technicians from informal repair
            work into audited, certified, higher-paying jobs.
          </p>
        </div>
      </div>

      {/* How Members Benefit */}
      <section className="py-20" style={{ backgroundColor: '#1C1917' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
            <div className="lg:col-span-1">
              <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-4">
                Why Members Join
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                8 outcomes that change your career trajectory.
              </h2>
              <p className="text-white/60 mt-6 leading-relaxed">
                From certification to supplier protection every benefit is designed to move the needle on income, compliance, and reputation.
              </p>
              <Link
                href="/membership"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: '#D97706' }}
              >
                See Membership Plans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MEMBER_BENEFITS.map((item, i) => (
                <div
                  key={i}
                  className="p-6 border border-white/10 transition-colors hover:bg-white/5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="p-2 inline-block mb-4" style={{ backgroundColor: 'rgba(217,119,6,0.15)', color: '#D97706' }}>
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-t border-white/10 pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">3.2×</p>
              <p className="mt-1 text-xs text-white/50 uppercase tracking-widest">Avg income lift</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">48%</p>
              <p className="mt-1 text-xs text-white/50 uppercase tracking-widest">More repeat clients</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">90 days</p>
              <p className="mt-1 text-xs text-white/50 uppercase tracking-widest">To first COC issuance</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">$7</p>
              <p className="mt-1 text-xs text-white/50 uppercase tracking-widest">Student entry price</p>
            </div>
          </div>
        </div>
      </section>

      {/* Member Success Stories */}
      <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1C1917' }}>Member Success Stories</h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: '#D97706' }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {TESTIMONIALS.map((member, index) => (
              <div
                key={index}
                className="bg-white border overflow-hidden"
                style={{ borderColor: '#E7E5E4' }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-bold text-lg">{member.name}</p>
                    <p className="text-sm text-white/80">{member.company}</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6 leading-relaxed italic">&ldquo;{member.quote}&rdquo;</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Member since</p>
                      <p className="font-semibold" style={{ color: '#1C1917' }}>{member.memberSince}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">COCs issued</p>
                      <p className="font-bold text-lg" style={{ color: '#D97706' }}>{member.cocIssued}</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full text-center text-sm font-medium" style={{ color: '#5A7D5A' }}>
                    View {member.name.split(' ')[0]}&rsquo;s Registry Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="py-8 px-6" style={{ backgroundColor: '#1C1917' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
                <p className="text-gray-300">Certified Technicians</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">1,200+</p>
                <p className="text-gray-300">COCs Issued</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">3,000+</p>
                <p className="text-gray-300">Jobs Logged</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
