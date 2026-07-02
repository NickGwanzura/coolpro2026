'use client';

import { useState } from 'react';
import { RefreshCw, Plus, X } from 'lucide-react';
import { useRecyclingRecords, createRecyclingRecord } from '@/lib/api';
import { RefrigerantAutocomplete, refrigerantLabel } from '@/components/RefrigerantAutocomplete';
import type { Refrigerant } from '@/types/index';

export default function RecyclingPage() {
  const { data: records, isLoading } = useRecyclingRecords();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<Refrigerant | null>(null);
  const [form, setForm] = useState({
    quantityKg: '',
    method: 'on-site-recycling',
    jobSite: '',
    recycledDate: new Date().toISOString().slice(0, 10),
  });

  const rows = records ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantityKg || !form.jobSite || !selectedRefrigerant) {
      setNotice('Complete all fields and select a refrigerant.');
      return;
    }
    setSubmitting(true);
    try {
      await createRecyclingRecord({
        refrigerantId: selectedRefrigerant.id,
        refrigerantLabel: refrigerantLabel(selectedRefrigerant),
        quantityKg: Number(form.quantityKg),
        method: form.method,
        jobSite: form.jobSite,
        recycledDate: form.recycledDate,
      });
      setShowModal(false);
      setForm({ quantityKg: '', method: 'on-site-recycling', jobSite: '', recycledDate: new Date().toISOString().slice(0, 10) });
      setSelectedRefrigerant(null);
      setNotice('Recycling record saved.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to save record.');
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
          <h1 className="text-2xl font-bold text-gray-900">Recycling</h1>
          <p className="mt-1 text-gray-500">On-site refrigerant recycling records.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309]">
          <Plus className="h-4 w-4" /> Log Recycling
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Method</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Job Site</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No recycling records yet.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-5 py-3 text-sm text-gray-600">{r.recycledDate}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.refrigerantLabel}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.quantityKg} kg</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.method}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.jobSite}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.technicianName}</td>
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
                <RefreshCw className="h-5 w-5 text-[#D97706]" /> Log Recycling
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
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
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Date</label>
                  <input type="date" value={form.recycledDate} onChange={(e) => setForm({ ...form, recycledDate: e.target.value })}
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Job Site</label>
                <input value={form.jobSite} onChange={(e) => setForm({ ...form, jobSite: e.target.value })}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#D97706] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
