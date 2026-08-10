'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateContractor } from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';

export default function AddContractorPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('Harare');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminCreateContractor({ email: email.trim(), region });
      success(result.emailSent
        ? 'Contractor invite sent. They will complete their own profile and questionnaire from the secure link.'
        : 'Contractor invite created. Email delivery failed; copy the secure link from Invites to share it manually.');
      router.push('/admin/invites');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create contractor invite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/contractors')} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invite a contractor</h1>
          <p className="mt-1 text-gray-500">Contractor access is invitation-only. The recipient completes their own profile and questionnaire.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This link is for a pre-approved contractor contact. It creates no active contractor profile until the invited person sets a password and submits the required business and trade details.
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Contractor contact email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contractor@example.co.zw" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Region *</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
            {ZIMBABWE_PROVINCES.map((province) => <option key={province.id} value={province.name}>{province.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/contractors')} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
            <Mail className="h-4 w-4" /> {submitting ? 'Sending…' : 'Send secure invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
