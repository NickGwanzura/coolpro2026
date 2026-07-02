'use client';

import { useState } from 'react';
import { FileText, Plus, X, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTradePermits, createTradePermit, reviewTradePermit } from '@/lib/api';
import { RefrigerantAutocomplete, refrigerantLabel } from '@/components/RefrigerantAutocomplete';
import { PermitPdfButton } from '@/components/PermitPdfButton';
import type { PermitStatus, PermitType, Refrigerant } from '@/types/index';

const STATUS_STYLES: Record<PermitStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  expired: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function PermitsPage() {
  const { user: session } = useAuth();
  const isAdmin = session?.role === 'org_admin';
  const { data: permits, isLoading } = useTradePermits();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<Refrigerant | null>(null);
  const [form, setForm] = useState({
    permitType: 'import' as PermitType,
    applicantCompany: '',
    quantityKg: '',
    countryOfOriginOrDestination: '',
  });

  const rows = permits ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicantCompany || !form.quantityKg || !form.countryOfOriginOrDestination || !selectedRefrigerant) {
      setNotice('Complete all fields and select a refrigerant.');
      return;
    }
    setSubmitting(true);
    try {
      await createTradePermit({
        permitType: form.permitType,
        applicantCompany: form.applicantCompany,
        refrigerantId: selectedRefrigerant.id,
        refrigerantLabel: refrigerantLabel(selectedRefrigerant),
        quantityKg: Number(form.quantityKg),
        countryOfOriginOrDestination: form.countryOfOriginOrDestination,
      });
      setShowModal(false);
      setForm({ permitType: 'import', applicantCompany: '', quantityKg: '', countryOfOriginOrDestination: '' });
      setSelectedRefrigerant(null);
      setNotice('Permit application submitted for NOU review.');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center justify-between border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          <span>{notice}</span>
          <button onClick={() => setNotice('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import / Export Permits</h1>
          <p className="mt-1 text-gray-500">NOU-issued permits for controlled refrigerant trade under the Montreal Protocol.</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309]">
            <Plus className="h-4 w-4" /> New Permit Application
          </button>
        )}
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Permit #</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applicant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">No permit applications yet.</td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-900">{p.permitNumber}</td>
                  <td className="px-5 py-3 text-sm capitalize text-gray-600">{p.permitType}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.applicantCompany}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.refrigerantLabel}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.quantityKg} kg</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {p.status === 'approved' && <PermitPdfButton permit={p} />}
                      {isAdmin && p.status === 'pending' && (
                        <>
                          <button onClick={() => reviewTradePermit(p.id, 'approve')} className="p-1.5 text-emerald-600 hover:bg-emerald-50" title="Approve">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => reviewTradePermit(p.id, 'reject')} className="p-1.5 text-rose-600 hover:bg-rose-50" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <FileText className="h-5 w-5 text-[#D97706]" /> New Permit Application
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Permit Type</label>
                <select value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value as PermitType })}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white">
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Applicant Company</label>
                <input value={form.applicantCompany} onChange={(e) => setForm({ ...form, applicantCompany: e.target.value })}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Refrigerant</label>
                <RefrigerantAutocomplete value={selectedRefrigerant} onSelect={setSelectedRefrigerant} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Quantity (kg)</label>
                  <input type="number" min="0" step="0.1" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })}
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Country</label>
                  <input value={form.countryOfOriginOrDestination} onChange={(e) => setForm({ ...form, countryOfOriginOrDestination: e.target.value })}
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#D97706] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
