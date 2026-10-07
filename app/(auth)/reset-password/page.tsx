'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';

const inputClass = 'block w-full rounded-lg border border-[#E7E5E4] bg-white px-3 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid or expired. Request another link.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Unable to reset the password.');
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      window.history.replaceState(null, '', '/reset-password?complete=1');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset the password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <section className="w-full max-w-md rounded-lg border border-[#E7E5E4] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">Choose a new password</h1>
        {success ? (
          <div className="mt-4 space-y-4">
            <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Your password was changed. Sign in again; other active sessions have been invalidated.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 rounded bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309]">
              <ArrowLeft className="h-4 w-4" /> Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[#78716C]">The link expires after 30 minutes and can only be used once. Passwords must be 8–72 UTF-8 bytes.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">New password</label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-9`} />
              </div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
              {error && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting || !token} className="w-full rounded bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b45309] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
        {!success && <Link href="/forgot-password" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft className="h-4 w-4" /> Request a new link
        </Link>}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white" />}><ResetPasswordForm /></Suspense>;
}
