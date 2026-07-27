'use client';

import { useAuth } from '@/lib/auth';
import SupplierRegistrationForm from '@/components/SupplierRegistrationForm';

export default function SupplierOnboardingPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-sm text-gray-500">Loading supplier onboarding…</div>;
  if (!user || user.role !== 'vendor') return <div className="p-8 text-sm text-gray-600">A supplier invitation is required to access this page.</div>;
  return (
    <main className="mx-auto max-w-3xl p-4 py-10 sm:p-8">
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Supplier onboarding</p><h1 className="mt-2 text-3xl font-bold text-gray-900">Complete your supplier profile</h1><p className="mt-2 text-gray-600">Provide the same company, refrigerant, and compliance details required for supplier registration.</p></div>
      <SupplierRegistrationForm inviteOnly invitedEmail={user.email} />
    </main>
  );
}
