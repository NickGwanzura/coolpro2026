'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, Users2, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useAdminUsers, updateAdminUser } from '@/lib/api';
import type { AdminUserRecord } from '@/types/index';

const ROLES = [
  { value: 'technician', label: 'Technician' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'student', label: 'Student' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

function UserRow({ user, isSelf }: { user: AdminUserRecord; isSelf: boolean }) {
  const [savingField, setSavingField] = useState<'role' | 'status' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (role: string) => {
    setError(null);
    setSavingField('role');
    try {
      await updateAdminUser(user.id, { role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setSavingField(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    setError(null);
    setSavingField('status');
    try {
      await updateAdminUser(user.id, { status: status as AdminUserRecord['status'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
          {isSelf && (
            <span className="shrink-0 border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              You
            </span>
          )}
          {user.isDemo && (
            <span className="shrink-0 border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Demo
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">{user.region}</p>
        {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <select
          value={user.role}
          disabled={savingField === 'role'}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-blue-300 disabled:opacity-50"
        >
          {user.role === 'org_admin' && (
            <option value="org_admin">Org Admin</option>
          )}
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={user.status}
          disabled={savingField === 'status'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`border px-2 py-1.5 text-xs font-bold uppercase tracking-wide outline-none disabled:opacity-50 ${STATUS_STYLES[user.status] ?? 'border-gray-200 text-gray-600'}`}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const ROLE_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: 'technician', label: 'Technicians' },
  { value: 'trainer', label: 'Trainers' },
  { value: 'lecturer', label: 'Lecturers' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'student', label: 'Students' },
  { value: 'org_admin', label: 'Org Admins' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { data, isLoading } = useAdminUsers(search || undefined);

  const users = (data?.data ?? []).filter(u => !roleFilter || u.role === roleFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Users</h1>
          <p className="mt-1 text-gray-500">
            Every account on the platform, across every role. Use the tabs below to filter by role.
            Change a role or status here to take effect immediately.
          </p>
        </div>
        <Link
          href="/admin/invites"
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Invite users
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="rounded-lg w-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {ROLE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold transition-colors ${
                  roleFilter === f.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Users2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">
            {isLoading ? 'Loading…' : `${users.length} account${users.length === 1 ? '' : 's'}`}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No users match your search or filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentUser?.id} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        You can&apos;t change your own role away from org_admin or deactivate your own account here —
        that guard prevents accidental lockout.
      </div>
    </div>
  );
}
