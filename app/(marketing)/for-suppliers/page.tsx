import Link from 'next/link';
import { ShieldCheck, RefreshCw, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

const CARDS = [
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: 'Verify Buyer Before Sale',
    description:
      'Before dispensing any regulated refrigerant, look up the buyer by registration number, QR code, or full name. The tool returns live certification status, authorised refrigerant classes, and standing with the NOU in under three seconds.',
  },
  {
    icon: <RefreshCw className="h-8 w-8" />,
    title: 'Reorder with Full Audit Trail',
    description:
      'Place refrigerant reorders through the HEVACRAZ platform. Each order goes through a two-step NOU approval flow and is logged immutably giving you clean records for any inspection or EPR audit, with no extra paperwork on your end.',
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
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
      <section className="pt-28 pb-20" style={{ backgroundColor: '#1C1917' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-4">
            For Suppliers
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl">
            Sell gas confidently.<br />Every buyer verified.
          </h1>
          <p className="mt-6 text-white/70 text-lg max-w-xl leading-relaxed">
            Registered suppliers on HEVACRAZ must verify buyer certification before any refrigerant sale. That requirement protects you against counterfeit transactions, unregistered dispensing, and NOU sanctions while making compliance automatic rather than manual.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/supplier-register"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white text-sm"
              style={{ backgroundColor: '#D97706' }}
            >
              Register as Supplier
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors"
            >
              Talk to the Team
            </Link>
          </div>
        </div>
      </section>

      {/* 3-card grid */}
      <section className="py-20" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: '#1C1917' }}>
              What Suppliers Get
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
                <p className="text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: '#1C1917' }}>
              Why suppliers trust HEVACRAZ
            </h2>
          </div>
          <div className="space-y-6">
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle className="h-6 w-6" style={{ color: '#5A7D5A' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#1C1917' }}>{item.heading}</h3>
                  <p className="mt-1 text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/supplier-register"
              className="inline-block font-semibold py-4 px-10 text-white text-lg"
              style={{ backgroundColor: '#D97706' }}
            >
              Register as Supplier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
