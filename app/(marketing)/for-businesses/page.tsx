import Link from 'next/link';
import { ShieldCheck, Users, Scale, ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const CARDS = [
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: 'Verify Technicians',
    description:
      'Search the National RAC Technician Registry by name, registration number, or QR code before awarding any installation or maintenance contract. Every result shows live certification status.',
    cta: 'Search Registry',
    href: '/verify-technician',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Enterprise Team Management',
    description:
      'Enrol your workforce, track CPD credits, manage bulk certification renewals, and generate compliance reports all from a single dashboard. Custom pricing for teams of 5 or more.',
    cta: 'Talk to Sales',
    href: '/contact',
  },
  {
    icon: <Scale className="h-8 w-8" />,
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
      <section
        className="pt-28 pb-20"
        style={{ backgroundColor: '#1C1917' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-4">
            For Businesses
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl">
            Hire with confidence.<br />Operate in compliance.
          </h1>
          <p className="mt-6 text-white/70 text-lg max-w-xl leading-relaxed">
            HEVACRAZ gives businesses the tools to verify the technicians they hire, manage team certifications at scale, and stay aligned with Zimbabwe&apos;s refrigerant regulations without extra overhead.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/verify-technician"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white text-sm"
              style={{ backgroundColor: '#D97706' }}
            >
              Verify a Technician Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors"
            >
              Talk to Enterprise Sales
            </Link>
          </div>
        </div>
      </section>

      {/* 3-card grid */}
      <section className="py-20" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: '#1C1917' }}>
              What Businesses Get
            </h2>
            <div className="w-24 h-1 mx-auto mt-4" style={{ backgroundColor: '#D97706' }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CARDS.map((card, i) => (
              <div
                key={i}
                className="p-8 border bg-white shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div className="p-4 inline-block mb-6" style={{ backgroundColor: '#FAFAF9' }}>
                  <span style={{ color: '#5A7D5A' }}>{card.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1C1917' }}>{card.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{card.description}</p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: '#D97706' }}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise pitch */}
      <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#1C1917' }}>
            Ready to bring your whole team into compliance?
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Enterprise accounts include bulk certification management, a dedicated account contact, custom reporting exports, and API access to embed verification into your own systems.
          </p>
          <Link
            href="/contact"
            className="inline-block font-semibold py-4 px-10 text-white text-lg"
            style={{ backgroundColor: '#1C1917' }}
          >
            Request Enterprise Quote
          </Link>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
