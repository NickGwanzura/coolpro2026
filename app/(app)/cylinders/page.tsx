'use client';

import { useState } from 'react';
import { Cylinder as CylinderIcon, Plus, X } from 'lucide-react';
import { useCylinders, createCylinder, updateCylinder } from '@/lib/api';
import { RefrigerantAutocomplete, refrigerantLabel } from '@/components/RefrigerantAutocomplete';
import type { Cylinder, CylinderStatus, Refrigerant } from '@/types/index';

const STATUS_STYLES: Record<CylinderStatus, string> = {
  full: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  empty: 'bg-gray-50 text-gray-600 border-gray-200',
  'in-service': 'bg-blue-50 text-blue-700 border-blue-200',
  scrapped: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_OPTIONS: CylinderStatus[] = ['full', 'partial', 'empty', 'in-service', 'scrapped'];

export default function CylindersPage() {
  const { data: cylinders, isLoading } = useCylinders();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<Refrigerant | null>(null);
  const [form, setForm] = useState({ cylinderCode: '', capacityKg: '', province: '' });

  const rows = cylinders ?? [];
  const stats = {
    total: rows.length,
    full: rows.filter((c) => c.status === 'full').length,
    inService: rows.filter((c) => c.status === 'in-service').length,
    scrapped: rows.filter((c) => c.status === 'scrapped').length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cylinderCode || !form.capacityKg || !selectedRefrigerant) {
      setNotice('Cylinder code, refrigerant, and capacity are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createCylinder({
        cylinderCode: form.cylinderCode.trim(),
        refrigerantId: selectedRefrigerant.id,
        refrigerantLabel: refrigerantLabel(selectedRefrigerant),
        ownerType: 'technician',
        capacityKg: Number(form.capacityKg),
        currentFillKg: 0,
        status: 'empty',
        province: form.province,
      });
      setShowModal(false);
      setForm({ cylinderCode: '', capacityKg: '', province: '' });
      setSelectedRefrigerant(null);
      setNotice('Cylinder registered.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to register cylinder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (cylinder: Cylinder, status: CylinderStatus) => {
    await updateCylinder(cylinder.id, { status });
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
          <h1 className="text-2xl font-bold text-gray-900">Cylinder Registry</h1>
          <p className="mt-1 text-gray-500">Track refrigerant cylinders in circulation across technicians and suppliers.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309]"
        >
          <Plus className="h-4 w-4" /> Register Cylinder
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Cylinders', value: stats.total },
          { label: 'Full', value: stats.full },
          { label: 'In Service', value: stats.inService },
          { label: 'Scrapped', value: stats.scrapped },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{s.label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cylinder</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Owner</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Capacity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No cylinders registered yet.</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-5 py-3 font-semibold text-gray-900">{c.cylinderCode}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.refrigerantLabel}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.ownerName} · {c.ownerType}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.currentFillKg} / {c.capacityKg} kg</td>
                  <td className="px-5 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c, e.target.value as CylinderStatus)}
                      className={`border px-2 py-1 text-xs font-semibold ${STATUS_STYLES[c.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-gray-200 bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <CylinderIcon className="h-5 w-5 text-[#D97706]" /> Register Cylinder
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Cylinder Code</label>
                <input value={form.cylinderCode} onChange={(e) => setForm({ ...form, cylinderCode: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" placeholder="CYL-0001" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Refrigerant</label>
                <RefrigerantAutocomplete value={selectedRefrigerant} onSelect={setSelectedRefrigerant} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Capacity (kg)</label>
                  <input type="number" min="0" step="0.1" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Province</label>
                  <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-[#D97706] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Saving…' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
