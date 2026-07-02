'use client';

import { useState } from 'react';
import { Recycle, Plus, X } from 'lucide-react';
import { useReclamationRecords, createReclamationRecord } from '@/lib/api';
import { RefrigerantAutocomplete, refrigerantLabel } from '@/components/RefrigerantAutocomplete';
import type { ReclamationStatus, Refrigerant } from '@/types/index';

const STATUS_STYLES: Record<ReclamationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ReclamationPage() {
  const { data: records, isLoading } = useReclamationRecords();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<Refrigerant | null>(null);
  const [form, setForm] = useState({ sourceDescription: '', quantityKg: '', purityPercent: '', facilityName: '' });

  const rows = records ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceDescription || !form.quantityKg || !form.facilityName || !selectedRefrigerant) {
      setNotice('Complete all fields and select a refrigerant.');
      return;
    }
    setSubmitting(true);
    try {
      await createReclamationRecord({
        refrigerantId: selectedRefrigerant.id,
        refrigerantLabel: refrigerantLabel(selectedRefrigerant),
        sourceDescription: form.sourceDescription,
        quantityKg: Number(form.quantityKg),
        purityPercent: form.purityPercent ? Number(form.purityPercent) : undefined,
        facilityName: form.facilityName,
        status: 'pending',
      });
      setShowModal(false);
      setForm({ sourceDescription: '', quantityKg: '', purityPercent: '', facilityName: '' });
      setSelectedRefrigerant(null);
      setNotice('Reclamation batch logged.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to log batch.');
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
          <h1 className="text-2xl font-bold text-gray-900">Reclamation</h1>
          <p className="mt-1 text-gray-500">Reclaiming recovered refrigerant back to reusable purity standard.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309]">
          <Plus className="h-4 w-4" /> Log Batch
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Batch #</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Source</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Purity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No reclamation batches logged yet.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-900">{r.batchNumber}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.refrigerantLabel}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.sourceDescription}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.quantityKg} kg</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.purityPercent ? `${r.purityPercent}%` : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>{r.status}</span>
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
                <Recycle className="h-5 w-5 text-[#D97706]" /> Log Reclamation Batch
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Refrigerant</label>
                <RefrigerantAutocomplete value={selectedRefrigerant} onSelect={setSelectedRefrigerant} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Source</label>
                <input value={form.sourceDescription} onChange={(e) => setForm({ ...form, sourceDescription: e.target.value })}
                  placeholder="e.g. Recovered from cold room retrofit — Meikles Hotel"
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Quantity (kg)</label>
                  <input type="number" min="0" step="0.1" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })}
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Purity (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={form.purityPercent} onChange={(e) => setForm({ ...form, purityPercent: e.target.value })}
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Facility</label>
                <input value={form.facilityName} onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#D97706] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Log Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
