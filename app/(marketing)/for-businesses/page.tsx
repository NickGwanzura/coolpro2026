import Link from 'next/link';
import { ShieldCheck, Users, Scale, ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const CARDS = [
  {
    icon: <ShieldCheck className="h-7 w-7" />,
    title: 'Verify Technicians',
    description:
      'Search the National RAC Technician Registry by name, registration number, or QR code before awarding any installation or maintenance contract. Every result shows live certification status.',
    cta: 'Search Registry',
    href: '/verify-technician',
  },
  {
    icon: <Users className="h-7 w-7" />,
    title: 'Enterprise Team Management',
    description:
      'Enrol your workforce, track CPD credits, manage bulk certification renewals, and generate compliance reports. All from a single dashboard. Custom pricing for teams of 5 or more.',
    cta: 'Talk to Sales',
    href: '/contact',
  },
  {
    icon: <Scale className="h-7 w-7" />,
    title: 'NOU Compliance Alignment',
    description:
      'Ensure your refrigerant procurement and disposal practices align with the National Ozone Unit requirements. Audit trails, signed declarations, and NOU-linked reporting built in.',
    cta: 'Learn More',
    href: '/faq',
  },
];

export default function ForBusinessesPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-20 sm:pb-24 overflow-hidden" style={{ backgroundColor: '#1C1917' }}>
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full opacity-[0.18] pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #D97706, transparent 70%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-4">
            For Businesses
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight max-w-3xl">
            Hire with confidence.
            <br />
            Operate in compliance.
          </h1>
          <p className="mt-6 text-white/75 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed">
            HEVACRAZ gives businesses the tools to verify the technicians they hire, manage team
            certifications at scale, and stay aligned with Zimbabwe&apos;s refrigerant regulations
            without extra overhead.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/verify-technician"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-white text-sm transition-all duration-200 hover:brightness-110 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ backgroundColor: '#D97706' }}
            >
              Verify a Technician Now
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm border border-white/40 text-white hover:bg-white/10 hover:border-white transition-colors backdrop-blur-sm"
            >
              Talk to Enterprise Sales
            </Link>
          </div>
        </div>
      </section>

      {/* 3-card grid */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight" style={{ color: '#1C1917' }}>
              What Businesses Get
            </h2>
            <div className="w-20 h-[3px] mx-auto mt-5" style={{ backgroundColor: '#D97706' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {CARDS.map((card, i) => (
              <div
                key={i}
                className="group flex flex-col p-7 sm:p-8 border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#D97706]/40"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div
                  className="inline-flex p-3.5 mb-6 transition-colors duration-300 group-hover:bg-[#D97706]/10 self-start"
                  style={{ backgroundColor: '#FAFAF9' }}
                >
                  <span className="transition-colors duration-300 group-hover:text-[#D97706]" style={{ color: '#5A7D5A' }}>
                    {card.icon}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 tracking-tight" style={{ color: '#1C1917' }}>
                  {card.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed mb-6 flex-1">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  className="group/cta inline-flex items-center gap-1.5 text-sm font-semibold transition-colors self-start"
                  style={{ color: '#D97706' }}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise pitch */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight" style={{ color: '#1C1917' }}>
            Ready to bring your whole team into compliance?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Enterprise accounts include bulk certification management, a dedicated account contact,
            custom reporting exports, and API access to embed verification into your own systems.
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 font-semibold py-4 px-10 text-white text-base sm:text-lg transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] focus-visible:ring-offset-2"
            style={{ backgroundColor: '#1C1917' }}
          >
            Request Enterprise Quote
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
