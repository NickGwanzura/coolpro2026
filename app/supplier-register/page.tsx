'use client';

import { ArrowLeftRight, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import SupplierRegistrationForm from '@/components/SupplierRegistrationForm';

export default function SupplierRegisterPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2C2420] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-gray-900">HEVACRAZ</p>
              <p className="text-xs text-gray-500">HVAC-R Professionals Zimbabwe</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Supplier onboarding
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-[#f8f0e6] p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#2C2420] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Supplier registration
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Register as a verified supplier
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Use this mock onboarding flow to submit company details, refrigerant categories, and
              business contacts. It is connected to the same Tailwind/Lucide design language used
              across the app.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#supplier-form"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Start registration
                <ArrowLeftRight className="h-4 w-4" />
              </Link>
              <Link
                href="/nou-dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Review compliance
              </Link>
            </div>
          </div>
        </section>

        <div id="supplier-form">
          <SupplierRegistrationForm />
        </div>
      </main>
    </div>
  );
}
