'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useContractorApplications } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HardHat, Mail, Phone, Search, UserPlus } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  invited: 'bg-gray-100 text-gray-700 border-gray-200',
  submitted: 'bg-amber-50 text-amber-800 border-amber-200',
  'under-review': 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function ContractorDirectoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: contractors, error, isLoading } = useContractorApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    const data = contractors ?? [];
    const term = searchTerm.trim().toLowerCase();
    return data.filter((c) => {
      const matchesSearch = !term ||
        [c.companyName, c.contactName, c.email, c.tradeSpecialization, c.region]
          .filter(Boolean).join(' ').toLowerCase().includes(term);
      const matchesStatus = !filterStatus || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [contractors, searchTerm, filterStatus]);

  if (authLoading || isLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  if (!user || user.role !== 'org_admin') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Access restricted to org admins only.
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Failed to load. {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractor Directory</h1>
          <p className="mt-1 text-gray-500">Invited contractors and their onboarding status.</p>
        </div>
        <Link
          href="/admin/contractors/add"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Contractor
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Invited" value={(contractors ?? []).length} />
        <SummaryCard label="Submitted" value={(contractors ?? []).filter((c) => c.status === 'submitted').length} />
        <SummaryCard label="Approved" value={(contractors ?? []).filter((c) => c.status === 'approved').length} />
        <SummaryCard label="Awaiting Onboarding" value={(contractors ?? []).filter((c) => c.status === 'invited').length} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company, contact, email, trade..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-amber-500">
              <option value="">All statuses</option>
              <option value="invited">Invited</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HardHat className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No contractors found</h3>
            <p className="text-gray-500">Invite a contractor to get started, or adjust your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{c.companyName || c.email}</h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
                      {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                      <span>{c.region}</span>
                      {c.tradeSpecialization && <span>{c.tradeSpecialization}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
