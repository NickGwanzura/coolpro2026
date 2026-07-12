'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Award, ChevronRight, RefreshCcw, Ban } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMemberships, useTechnicians, updateMembership } from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import { useToast } from '@/components/ui/Toast';
import type { MembershipStatus, Technician } from '@/types/index';

const STATUS_BADGE: Record<MembershipStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  expired: 'bg-gray-50 text-gray-600 border-gray-200',
  suspended: 'bg-amber-50 text-amber-800 border-amber-200',
  revoked: 'bg-rose-50 text-rose-800 border-rose-200',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(iso));
}

export default function MembershipsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const [provinceFilter, setProvinceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<'' | 'expiring-soon' | 'expired'>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: memberships } = useMemberships({
    province: provinceFilter || undefined,
    status: statusFilter || undefined,
    q: searchTerm || undefined,
  });
  const { data: technicians } = useTechnicians();

  const technicianById = useMemo(() => {
    const map = new Map<string, Technician>();
    for (const t of technicians ?? []) map.set(t.id, t);
    return map;
  }, [technicians]);

  const filtered = useMemo(() => {
    let rows = memberships ?? [];
    if (expiryFilter === 'expiring-soon') {
      const soon = Date.now() + 60 * 24 * 60 * 60 * 1000;
      rows = rows.filter((m) => m.status === 'active' && new Date(m.expiryDate).getTime() <= soon);
    } else if (expiryFilter === 'expired') {
      rows = rows.filter((m) => new Date(m.expiryDate).getTime() < Date.now());
    }
    return rows;
  }, [memberships, expiryFilter]);

  const resetFilters = () => {
    setProvinceFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setExpiryFilter('');
  };

  const handleRenew = async (id: string) => {
    setBusyId(id);
    try {
      await updateMembership(id, { renew: true });
      success('Membership renewed.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to renew membership.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setBusyId(id);
    try {
      await updateMembership(id, { status: 'suspended' });
      success('Membership suspended.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to suspend membership.');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'org_admin') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Access restricted. This page is for HEVACRAZ admins only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">HEVACRAZ admin</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Memberships</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
          HEVACRAZ membership is distinct from technician registration — a technician can be
          registered without an active membership. Memberships run on a calendar year.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search membership number"
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white"
            />
          </div>
          <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white">
            <option value="">All provinces</option>
            {ZIMBABWE_PROVINCES.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | '')} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
          <select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value as typeof expiryFilter)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white">
            <option value="">Any expiry</option>
            <option value="expiring-soon">Expiring within 60 days</option>
            <option value="expired">Already expired</option>
          </select>
          {(provinceFilter || statusFilter || searchTerm || expiryFilter) && (
            <button onClick={resetFilters} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {!memberships ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Award className="mx-auto mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-500">No memberships match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Membership #</th>
                  <th className="px-5 py-3">Province</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => {
                  const technician = technicianById.get(m.technicianId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/technician-registry/${m.technicianId}`} className="font-medium text-blue-700 hover:underline">
                          {technician?.name ?? 'Unknown technician'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{m.membershipNumber}</td>
                      <td className="px-5 py-3 text-gray-500">{m.province}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${STATUS_BADGE[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(m.expiryDate)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {m.status !== 'active' && (
                            <button
                              onClick={() => handleRenew(m.id)}
                              disabled={busyId === m.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <RefreshCcw className="h-3 w-3" /> Renew
                            </button>
                          )}
                          {m.status === 'active' && (
                            <button
                              onClick={() => handleSuspend(m.id)}
                              disabled={busyId === m.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <Ban className="h-3 w-3" /> Suspend
                            </button>
                          )}
                          {technician && (
                            <Link href={`/technician-registry/${technician.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900">
                              Profile <ChevronRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
