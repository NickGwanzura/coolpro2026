import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-24 text-white overflow-hidden" style={{ backgroundColor: '#1C1917' }}>
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, #D97706, transparent 70%)' }}
      />
      {/* Top accent line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-4">
          Get started today
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight">
          Ready to Advance Your HVAC-R Career?
        </h2>
        <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed">
          Join Zimbabwe&apos;s leading professional association today.
        </p>
        <Link
          href="/join"
          className="group inline-flex items-center gap-2 font-semibold py-4 px-10 text-base sm:text-lg shadow-sm hover:shadow-xl hover:brightness-110 transition-all duration-200 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
          style={{ backgroundColor: '#D97706' }}
        >
          Become a Member Now
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
