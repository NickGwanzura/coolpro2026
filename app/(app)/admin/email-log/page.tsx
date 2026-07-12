'use client';

import { useMemo, useState } from 'react';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useEmailLog } from '@/lib/api';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function typeLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export default function EmailLogAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: entries } = useEmailLog();
  const [typeFilter, setTypeFilter] = useState('');

  const types = useMemo(() => [...new Set((entries ?? []).map((e) => e.emailType))].sort(), [entries]);
  const filtered = useMemo(
    () => (entries ?? []).filter((e) => !typeFilter || e.emailType === typeFilter),
    [entries, typeFilter],
  );

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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Email Activity</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
          Every outbound application/membership email, with delivery status.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white">
          <option value="">All email types</option>
          {types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {!entries ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="mx-auto mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-500">No emails logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Related to</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{typeLabel(e.emailType)}</td>
                    <td className="px-5 py-3 text-gray-500">{e.recipientEmail}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{e.relatedEntityType ? `${e.relatedEntityType.replace('_', ' ')}` : '—'}</td>
                    <td className="px-5 py-3">
                      {e.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800" title={e.errorMessage}>
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(e.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
