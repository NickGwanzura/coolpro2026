import Link from 'next/link';
import { ShieldCheck, RefreshCw, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

const CARDS = [
  {
    icon: <ShieldCheck className="h-7 w-7" />,
    title: 'Verify Buyer Before Sale',
    description:
      'Before dispensing any regulated refrigerant, look up the buyer by registration number, QR code, or full name. The tool returns live certification status, authorised refrigerant classes, and standing with the NOU in under three seconds.',
  },
  {
    icon: <RefreshCw className="h-7 w-7" />,
    title: 'Reorder with Full Audit Trail',
    description:
      'Place refrigerant reorders through the HEVACRAZ platform. Each order goes through a two-step NOU approval flow and is logged immutably, giving you clean records for any inspection or EPR audit, with no extra paperwork on your end.',
  },
  {
    icon: <BookOpen className="h-7 w-7" />,
    title: 'Public Supplier Directory Listing',
    description:
      'Registered suppliers appear in the HEVACRAZ supplier directory, visible to every certified technician on the platform. Verified-supplier badges signal trust and compliance to buyers, driving qualified traffic to your business.',
  },
];

const TRUST_ITEMS = [
  {
    heading: 'Compliance burden lifted',
    body: 'Regulatory checks are built into every transaction. You sell; we handle the verification trail.',
  },
  {
    heading: 'Every reorder tracked',
    body: 'NOU 2-step approval means your stock movements are audited and defensible from day one.',
  },
  {
    heading: 'Disputes reduced',
    body: 'Timestamped, signed sale records mean fewer after-the-fact disagreements and zero grey-market liability.',
  },
];

export default function ForSuppliersPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-20 sm:pb-24 overflow-hidden" style={{ backgroundColor: '#1C1917' }}>
        <div
          aria-hidden
          className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full opacity-[0.18] pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #5A7D5A, transparent 70%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-4">
            For Suppliers
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight max-w-3xl">
            Sell gas confidently.
            <br />
            <span className="text-[#f5b66b]">Every buyer verified.</span>
          </h1>
          <p className="mt-6 text-white/75 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed">
            Registered suppliers on HEVACRAZ must verify buyer certification before any refrigerant
            sale. That requirement protects you against counterfeit transactions, unregistered
            dispensing, and NOU sanctions, while making compliance automatic rather than manual.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/supplier-register"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-white text-sm transition-all duration-200 hover:brightness-110 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ backgroundColor: '#D97706' }}
            >
              Register as Supplier
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm border border-white/40 text-white hover:bg-white/10 hover:border-white transition-colors backdrop-blur-sm"
            >
              Talk to the Team
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
              What Suppliers Get
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
                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed flex-1">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
              Why suppliers trust HEVACRAZ
            </h2>
            <div className="w-20 h-[3px] mx-auto mt-5" style={{ backgroundColor: '#5A7D5A' }} />
          </div>
          <ul className="space-y-5 sm:space-y-6">
            {TRUST_ITEMS.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 border transition-colors hover:bg-[#FAFAF9]"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div className="mt-0.5 shrink-0 p-1.5" style={{ backgroundColor: 'rgba(90,125,90,0.1)' }}>
                  <CheckCircle className="h-5 w-5" style={{ color: '#5A7D5A' }} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg tracking-tight" style={{ color: '#1C1917' }}>
                    {item.heading}
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-[15px] text-gray-600 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-14 sm:mt-16 text-center">
            <Link
              href="/supplier-register"
              className="group inline-flex items-center gap-2 font-semibold py-4 px-10 text-white text-base sm:text-lg transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
              style={{ backgroundColor: '#D97706' }}
            >
              Register as Supplier
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
