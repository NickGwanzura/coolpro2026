import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-20 text-white" style={{ backgroundColor: '#1C1917' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Advance Your HVAC-R Career?</h2>
        <p className="text-xl text-gray-300 mb-10">Join Zimbabwe&apos;s leading professional association today</p>
        <Link
          href="/login"
          className="inline-block font-semibold py-4 px-10 transition-all duration-300 text-lg shadow-sm hover:shadow-md text-white"
          style={{ backgroundColor: '#D97706' }}
        >
          Become a Member Now
        </Link>
      </div>
    </section>
  );
}
