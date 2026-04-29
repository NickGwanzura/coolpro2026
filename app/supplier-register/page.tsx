import Link from 'next/link';
import { ArrowLeft, Factory } from 'lucide-react';
import SupplierRegistrationForm from '@/components/SupplierRegistrationForm';

export default function SupplierRegisterPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <section className="pt-28 sm:pt-32 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1C1917] transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to paths
          </Link>
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 p-2.5 mt-1"
              style={{ backgroundColor: 'rgba(217,119,6,0.10)', color: '#D97706' }}
            >
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <p
                className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-2"
                style={{ color: '#D97706' }}
              >
                Supplier Registration
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]"
                style={{ color: '#1C1917' }}
              >
                Register as an approved
                <br className="hidden sm:block" /> refrigerant supplier
              </h1>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Submit company details and refrigerant categories. Approved suppliers gain access to
                the verified-buyer flow, two-step NOU reorders, and the public supplier directory.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SupplierRegistrationForm />
        </div>
      </section>
    </div>
  );
}
