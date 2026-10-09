'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, MailWarning } from 'lucide-react';
import { APPLICANT_ROLES, isApplicantRole } from '@/lib/application-roles';
import { resendApplicationVerification } from '@/lib/api';

type View =
  | { kind: 'checking' }
  | { kind: 'verified'; role?: string; already: boolean }
  | { kind: 'problem'; expired: boolean };

export function VerifyEmailClient() {
  const token = useSearchParams().get('token') ?? '';
  const [view, setView] = useState<View>({ kind: 'checking' });
  const [email, setEmail] = useState('');
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const started = useRef(false);

  useEffect(() => {
    // The link is confirmed by a button-less POST from this page rather than a GET, so email
    // scanners that merely open links do not confirm an address on the applicant's behalf.
    if (started.current) return;
    started.current = true;
    if (!token) {
      setView({ kind: 'problem', expired: false });
      return;
    }
    fetch('/api/applications/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { state?: string; role?: string };
        if (body.state === 'verified' || body.state === 'already-verified') {
          setView({ kind: 'verified', role: body.role, already: body.state === 'already-verified' });
        } else {
          setView({ kind: 'problem', expired: body.state === 'expired' });
        }
      })
      .catch(() => setView({ kind: 'problem', expired: false }));
  }, [token]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setResend('sending');
    try {
      await resendApplicationVerification(email.trim().toLowerCase());
      setResend('sent');
    } catch {
      setResend('failed');
    }
  }

  const info = view.kind === 'verified' && view.role && isApplicantRole(view.role) ? APPLICANT_ROLES[view.role] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] px-4 py-24">
      <div className="w-full max-w-md border border-[#E5E0DB] bg-white p-8 text-center shadow-sm">
        {view.kind === 'checking' && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <h1 className="mt-4 text-xl font-bold text-[#1C1917]">Confirming your email…</h1>
          </>
        )}

        {view.kind === 'verified' && (
          <>
            <CheckCircle className="mx-auto h-10 w-10 text-[#5A7D5A]" />
            <h1 className="mt-4 text-xl font-bold text-[#1C1917]">
              {view.already ? 'Your email is already confirmed' : 'Email confirmed'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {view.already
                ? 'Your application is with our reviewers. We will email you the decision.'
                : `Thank you. Your application is now in the review queue${info ? `, usually reviewed within ${info.reviewTime}` : ''}. We will email you the decision, and we have sent you a message confirming we received it.`}
            </p>
            <Link href="/" className="mt-6 inline-flex items-center justify-center bg-[#1C1917] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2C2420]">
              Return home
            </Link>
          </>
        )}

        {view.kind === 'problem' && (
          <>
            <MailWarning className="mx-auto h-10 w-10 text-[#D97706]" />
            <h1 className="mt-4 text-xl font-bold text-[#1C1917]">
              {view.expired ? 'This link has expired' : 'We could not use this link'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {view.expired ? 'Confirmation links work for 48 hours.' : 'It may be incomplete, or a newer link may have replaced it.'} Enter the email you applied with and we will send a fresh link.
            </p>
            {resend === 'sent' ? (
              <p className="mt-5 text-sm font-semibold text-[#5A7D5A]">
                If that address has an application waiting, a new link is on its way.
              </p>
            ) : (
              <form onSubmit={handleResend} className="mt-5 space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#E5E0DB] bg-[#FAFAF9] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1C1917]/20"
                />
                <button
                  type="submit"
                  disabled={resend === 'sending'}
                  className="w-full bg-[#D97706] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {resend === 'sending' ? 'Sending…' : 'Send me a new link'}
                </button>
                {resend === 'failed' && <p className="text-sm text-rose-600">Could not send it. Please try again shortly.</p>}
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
