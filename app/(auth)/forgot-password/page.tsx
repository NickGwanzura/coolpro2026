'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

const inputClass = 'block w-full rounded-lg border border-[#E7E5E4] bg-white px-3 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Unable to process the request. Try again later.');
      setMessage(data.message ?? 'If an active account matches that email, a password reset link will be sent shortly.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to process the request. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <section className="w-full max-w-md rounded-lg border border-[#E7E5E4] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-[#78716C]">
          Enter your account email. If it matches an active account, we’ll send a secure, single-use reset link.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Work email</label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="name@company.com"
            />
          </div>
          {message && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b45309] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </section>
    </main>
  );
}
