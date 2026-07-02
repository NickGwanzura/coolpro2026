'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, XCircle, Loader2, UserPlus } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

interface InvitePreview {
  email: string;
  role: string;
  region: string;
  expiresAt: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('This invite link is missing a token.');
      setLoading(false);
      return;
    }
    fetch(`/api/invites/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? 'Invite not found.');
        } else {
          setInvite(data);
        }
      })
      .catch(() => setLoadError('Could not load this invite. Try again shortly.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Could not accept this invite.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setSubmitError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] px-4">
      <div className="w-full max-w-md border border-[#E5E0DB] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2.5" style={{ backgroundColor: 'rgba(217,119,6,0.10)', color: '#D97706' }}>
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#D97706' }}>
              HEVACRAZ / NOU
            </p>
            <h1 className="text-xl font-bold" style={{ color: '#1C1917' }}>Accept your invite</h1>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading invite…
          </div>
        )}

        {!loading && loadError && (
          <div className="border border-rose-200 bg-rose-50 p-5 text-center">
            <XCircle className="mx-auto mb-2 h-7 w-7 text-rose-500" />
            <p className="text-sm font-semibold text-rose-800">{loadError}</p>
            <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-[#D97706]">
              Go to login
            </Link>
          </div>
        )}

        {!loading && invite && (
          <>
            <div className="mb-5 border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="text-gray-500">You&apos;re accepting an invite for</p>
              <p className="mt-1 font-semibold text-gray-900">{invite.email}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">
                {invite.role} · {invite.region}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Password</label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white"
                />
                <p className="mt-1 text-xs text-gray-400">At least {MIN_PASSWORD_LENGTH} characters.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:bg-white"
                />
              </div>

              {submitError && (
                <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 bg-[#D97706] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Create account
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteContent />
    </Suspense>
  );
}
