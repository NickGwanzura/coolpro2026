'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Info, Mail, RotateCw, Search, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { resendLoggedEmail, useEmailLog } from '@/lib/api';
import { EMAIL_STATUSES, isProblem, relatedLink, STATUS_LABEL, typeLabel, type EmailStatus } from '@/lib/email-status';
import type { EmailLogEntry } from '@/types/index';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

const STATUS_STYLE: Record<EmailStatus, string> = {
  sent: 'border-sky-200 bg-sky-50 text-sky-800',
  delayed: 'border-amber-200 bg-amber-50 text-amber-800',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
  bounced: 'border-rose-200 bg-rose-50 text-rose-800',
  complained: 'border-rose-200 bg-rose-50 text-rose-800',
};

function StatusBadge({ status }: { status: EmailStatus }) {
  const Icon = status === 'delivered' ? CheckCircle2 : isProblem(status) ? XCircle : status === 'delayed' ? Clock : Mail;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      <Icon className="h-3 w-3" /> {STATUS_LABEL[status]}
    </span>
  );
}

function SummaryCard({ label, value, note, tone }: { label: string; value: number; note: string; tone: 'neutral' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' && value > 0 ? 'text-rose-700' : 'text-gray-900';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </div>
  );
}

export default function EmailLogAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resending, setResending] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, error, isLoading } = useEmailLog({ status, type, q: search, from, to, page });

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

  const summary = data?.summary;
  const problems = summary ? summary.failed + summary.bounced + summary.complained : 0;
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, total);
  const filtering = Boolean(status || type || search || from || to);
  const trackingMissing = summary ? summary.delivered === 0 && summary.sent > 0 : false;

  function reset() {
    setStatus(''); setType(''); setFrom(''); setTo(''); setSearchInput(''); setSearch(''); setPage(1);
  }
  function change<T>(setter: (value: T) => void) {
    return (value: T) => { setter(value); setPage(1); };
  }

  async function handleResend(entry: EmailLogEntry) {
    setResending(entry.id);
    setResendNote(null);
    try {
      await resendLoggedEmail(entry.id);
      setResendNote({ tone: 'ok', text: `Sent again to ${entry.recipientEmail}.` });
    } catch (err) {
      setResendNote({ tone: 'error', text: err instanceof Error ? err.message : 'Could not send it again.' });
    } finally {
      setResending(null);
    }
  }

  const inputClass = 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">HEVACRAZ admin</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Email Activity</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
          Every email the registry sends, with what happened to it. The page refreshes itself every 30 seconds.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load the email activity. Refresh the page to try again.
        </div>
      )}

      {summary && (
        <section aria-label={`Last ${summary.days} days`} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Emails sent" value={summary.sent + summary.delivered + summary.delayed + problems} note={`Last ${summary.days} days`} tone="neutral" />
            <SummaryCard label="Delivered" value={summary.delivered} note="Confirmed by the receiving mail server" tone="good" />
            <SummaryCard label="Accepted" value={summary.sent + summary.delayed} note="Taken by the mail service, delivery not confirmed yet" tone="neutral" />
            <SummaryCard label="Needs attention" value={problems} note={`${summary.failed} failed, ${summary.bounced} bounced, ${summary.complained} spam`} tone="bad" />
          </div>
          {problems > 0 && (
            <button type="button" onClick={() => { setStatus('problems'); setPage(1); }} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100">
              <AlertTriangle className="h-4 w-4" /> Show only the {problems} that need attention
            </button>
          )}
          {trackingMissing && (
            <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Delivery tracking is not connected yet, so every email stays at &quot;Accepted&quot;, which only means the mail service took it. To see delivered, bounced and spam reports, add a webhook in the Resend dashboard pointing to <code className="rounded bg-white px-1">/api/webhooks/resend</code> and save its signing secret as <code className="rounded bg-white px-1">RESEND_WEBHOOK_SECRET</code>.
            </p>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[220px] flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search recipient, subject or name"
            aria-label="Search emails"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => change(setStatus)(e.target.value)} aria-label="Filter by status" className={inputClass}>
          <option value="">All statuses</option>
          <option value="problems">Needs attention</option>
          {EMAIL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={type} onChange={(e) => change(setType)(e.target.value)} aria-label="Filter by email type" className={inputClass}>
          <option value="">All email types</option>
          {(data?.types ?? []).map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          From <input type="date" value={from} onChange={(e) => change(setFrom)(e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          To <input type="date" value={to} onChange={(e) => change(setTo)(e.target.value)} className={inputClass} />
        </label>
        {filtering && (
          <button type="button" onClick={reset} className="text-sm font-semibold text-blue-700 hover:underline">Clear filters</button>
        )}
      </div>

      {resendNote && (
        <p role={resendNote.tone === 'error' ? 'alert' : 'status'} className={`text-sm ${resendNote.tone === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{resendNote.text}</p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading && !data ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !data || data.items.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="mx-auto mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-500">{filtering ? 'No emails match these filters.' : 'No emails have been sent yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">About</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((e) => {
                  const link = relatedLink(e.relatedEntityType);
                  const aboutText = e.relatedLabel ?? (e.relatedEntityType ? e.relatedEntityType.replace(/_/g, ' ') : '—');
                  return (
                    <tr key={e.id} className="align-top hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{typeLabel(e.emailType)}</p>
                        {e.subject && <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500" title={e.subject}>{e.subject}</p>}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{e.recipientEmail}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {link ? <Link href={link} className="font-semibold text-blue-700 hover:underline">{aboutText}</Link> : aboutText}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={e.status as EmailStatus} />
                        {e.errorMessage && isProblem(e.status) && (
                          <p className="mt-1 max-w-xs text-xs leading-5 text-rose-700">{e.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-500">{formatDate(e.sentAt)}</td>
                      <td className="px-5 py-3 text-right">
                        {e.canResend && (
                          <button
                            type="button"
                            onClick={() => void handleResend(e)}
                            disabled={resending === e.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${resending === e.id ? 'animate-spin' : ''}`} /> Send again
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-600 sm:flex-row">
            <span>Showing {firstShown}–{lastShown} of {total.toLocaleString()}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
