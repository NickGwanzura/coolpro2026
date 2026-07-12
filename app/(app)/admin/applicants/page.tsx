'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Award,
  Search,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTechnicianApplications, useTechnicians, useMemberships } from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import type { ApplicationStatus, TechnicianApplication } from '@/types/index';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  submitted: 'bg-amber-50 text-amber-800 border-amber-200',
  'under-review': 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

const PAGE_SIZE = 15;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(iso));
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${STATUS_BADGE[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Users; accent: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

type SortKey = 'submittedAt' | 'name' | 'province';

export default function ApplicantsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: applications } = useTechnicianApplications();
  const { data: technicians } = useTechnicians();
  const { data: activeMemberships } = useMemberships({ status: 'active' });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const apps = useMemo(() => applications ?? [], [applications]);

  const stats = useMemo(() => {
    const pending = apps.filter((a) => a.status === 'submitted' || a.status === 'under-review').length;
    const approved = apps.filter((a) => a.status === 'approved').length;
    const rejected = apps.filter((a) => a.status === 'rejected').length;
    return {
      total: apps.length,
      pending,
      approved,
      rejected,
      totalTechnicians: technicians?.length ?? 0,
      activeMemberships: activeMemberships?.length ?? 0,
    };
  }, [apps, technicians, activeMemberships]);

  const provinceStats = useMemo(() => {
    const byProvince = new Map<string, { total: number; pending: number }>();
    for (const app of apps) {
      const entry = byProvince.get(app.province) ?? { total: 0, pending: 0 };
      entry.total += 1;
      if (app.status === 'submitted' || app.status === 'under-review') entry.pending += 1;
      byProvince.set(app.province, entry);
    }
    return [...byProvince.entries()]
      .map(([province, counts]) => ({ province, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [apps]);

  const recentApplications = useMemo(
    () => [...apps].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5),
    [apps],
  );

  const awaitingReview = useMemo(
    () => apps.filter((a) => a.status === 'submitted' || a.status === 'under-review')
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .slice(0, 5),
    [apps],
  );

  const filteredSorted = useMemo(() => {
    let result = [...apps];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.registrationNumber.toLowerCase().includes(term) ||
        a.contactNumber.toLowerCase().includes(term)
      );
    }
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (provinceFilter) result = result.filter((a) => a.province === provinceFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'submittedAt') cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = a.province.localeCompare(b.province);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [apps, searchTerm, statusFilter, provinceFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setProvinceFilter('');
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
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
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">HEVACRAZ admin</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Applicant Review Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
          Review technician applications, manage memberships, and track approvals across the
          national registry.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Applicants" value={stats.total} icon={Users} accent="bg-slate-50 text-slate-700" />
        <KpiCard label="Pending" value={stats.pending} icon={Clock} accent="bg-amber-50 text-amber-700" />
        <KpiCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" />
        <KpiCard label="Rejected" value={stats.rejected} icon={XCircle} accent="bg-rose-50 text-rose-700" />
        <KpiCard label="Total Technicians" value={stats.totalTechnicians} icon={Wrench} accent="bg-blue-50 text-blue-700" />
        <KpiCard label="Active Memberships" value={stats.activeMemberships} icon={Award} accent="bg-purple-50 text-purple-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApplications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No applications yet.</p>
            ) : (
              recentApplications.map((app) => (
                <Link key={app.id} href={`/admin/applicants/${app.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.province} · {formatDate(app.submittedAt)}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Awaiting review */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Awaiting Review</h2>
            {stats.pending > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{stats.pending}</span>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {awaitingReview.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nothing awaiting review.</p>
            ) : (
              awaitingReview.map((app) => (
                <Link key={app.id} href={`/admin/applicants/${app.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">Submitted {formatDate(app.submittedAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Province stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Applications by Province</h2>
        {provinceStats.length === 0 ? (
          <p className="text-sm text-gray-400">No data yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {provinceStats.map((p) => (
              <button
                key={p.province}
                onClick={() => { setProvinceFilter(p.province); setPage(1); }}
                className={`rounded-lg border p-3 text-left transition-colors ${provinceFilter === p.province ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className="flex items-center gap-1 text-xs font-semibold text-gray-600"><MapPin className="h-3 w-3" />{p.province}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{p.total}</p>
                {p.pending > 0 && <p className="text-[11px] text-amber-700">{p.pending} pending</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Applicants table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-gray-900">All Applicants</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search name, email, phone, reg. number"
                className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ApplicationStatus | ''); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={provinceFilter}
              onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="">All provinces</option>
              {ZIMBABWE_PROVINCES.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {(searchTerm || statusFilter || provinceFilter) && (
              <button onClick={resetFilters} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!applications ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : pageItems.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No applicants match your filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="cursor-pointer px-5 py-3" onClick={() => toggleSort('name')}>Name{sortKey === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="cursor-pointer px-5 py-3" onClick={() => toggleSort('province')}>Province{sortKey === 'province' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                    <th className="cursor-pointer px-5 py-3" onClick={() => toggleSort('submittedAt')}>Submitted{sortKey === 'submittedAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Reg. Number</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageItems.map((app: TechnicianApplication) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{app.name}</td>
                      <td className="px-5 py-3 text-gray-500">Technician</td>
                      <td className="px-5 py-3 text-gray-500">{app.province}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(app.submittedAt)}</td>
                      <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{app.registrationNumber}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/applicants/${app.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                          Review <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              <span>Page {page} of {totalPages} · {filteredSorted.length} total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
