'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { submitContractorOnboarding } from '@/lib/api';

const TRADE_SPECIALIZATIONS = [
  'Installation',
  'Ductwork Fabrication',
  'Electrical',
  'Piping / Brazing',
  'Insulation',
  'General Contracting',
  'Other',
];

const YEARS_OPTIONS = ['Under 1 year', '1-3 years', '4-10 years', '11-20 years', '20+ years'];
const TEAM_SIZE_OPTIONS = ['Just me', '2-5', '6-20', '21-50', '50+'];
const CERTIFICATION_OPTIONS = ['Yes', 'No', 'In progress'];

const SERVICE_OPTIONS = [
  'New Installation',
  'Retrofit',
  'Maintenance & Servicing',
  'Emergency Repairs',
  'Refrigerant Recovery',
  'Ductwork',
  'Electrical',
  'Consulting',
];

export default function ContractorOnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    tradeSpecialization: '',
    yearsInOperation: '',
    teamSize: '',
    hasSafetyCertification: '',
    biggestChallenge: '',
  });
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);

  const toggleService = (service: string) =>
    setServicesOffered((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName || !form.contactName || !form.phone || !form.tradeSpecialization || !form.yearsInOperation || !form.teamSize || !form.hasSafetyCertification) {
      error('Please complete all required fields.');
      return;
    }
    if (servicesOffered.length === 0) {
      error('Select at least one service you offer.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContractorOnboarding({ ...form, servicesOffered });
      success('Profile submitted. HEVACRAZ will follow up if anything further is needed.');
      router.push('/dashboard');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to submit your profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  if (!user || user.role !== 'contractor') {
    return <div className="p-8 text-sm text-gray-600">A contractor invitation is required to access this page.</div>;
  }

  return (
    <main className="mx-auto max-w-3xl p-4 py-10 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Contractor onboarding</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Complete your contractor profile</h1>
        <p className="mt-2 text-gray-600">Tell us about your business and the work you do, so HEVACRAZ and NOU can match you to the right opportunities.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Company name *</label>
            <input type="text" required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contact name *</label>
            <input type="text" required value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trade specialization *</label>
            <select required value={form.tradeSpecialization} onChange={(e) => setForm((f) => ({ ...f, tradeSpecialization: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
              <option value="">Select specialization</option>
              {TRADE_SPECIALIZATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Years in operation *</label>
            <select required value={form.yearsInOperation} onChange={(e) => setForm((f) => ({ ...f, yearsInOperation: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
              <option value="">Select range</option>
              {YEARS_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Team size *</label>
            <select required value={form.teamSize} onChange={(e) => setForm((f) => ({ ...f, teamSize: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
              <option value="">Select range</option>
              {TEAM_SIZE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Safety certification on file? *</label>
            <select required value={form.hasSafetyCertification} onChange={(e) => setForm((f) => ({ ...f, hasSafetyCertification: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
              <option value="">Select an answer</option>
              {CERTIFICATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Services offered * (select all that apply)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICE_OPTIONS.map((service) => (
              <label key={service} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <input type="checkbox" checked={servicesOffered.includes(service)} onChange={() => toggleService(service)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                {service}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Biggest challenge in your work</label>
          <textarea rows={3} value={form.biggestChallenge} onChange={(e) => setForm((f) => ({ ...f, biggestChallenge: e.target.value }))} placeholder="e.g. access to spare parts, load shedding, finding trained staff" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit profile'}
          </button>
        </div>
      </form>
    </main>
  );
}
