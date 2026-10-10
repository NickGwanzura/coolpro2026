'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, MailCheck } from 'lucide-react';
import { APPLICANT_ROLES, type ApplicantRole } from '@/lib/application-roles';
import { resendApplicationVerification } from '@/lib/api';

type ResendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Shown after any self-registration is submitted. The application is not reviewed until the
 * applicant confirms their email, so this screen's main job is to tell them to check their inbox.
 */
export function ApplicationSubmittedNotice({
  name,
  email,
  reference,
  role,
  accent,
  accentTint,
}: {
  name: string;
  email: string;
  reference: string;
  role: ApplicantRole;
  accent: string;
  accentTint: string;
}) {
  const [resend, setResend] = useState<ResendState>('idle');
  const info = APPLICANT_ROLES[role];

  async function handleResend() {
    setResend('sending');
    try {
      await resendApplicationVerification(email);
      setResend('sent');
    } catch {
      setResend('failed');
    }
  }

  const steps = [
    { title: 'Confirm your email', body: `Open the message we sent to ${email} and click “Confirm my email”. You can then upload your supporting documents.` },
    { title: 'We review your application', body: `A reviewer checks ${info.reviewFocus}, usually within ${info.reviewTime}.` },
    { title: 'You hear from us', body: 'We email you the decision. If approved, you can log in straight away.' },
  ];

  return (
    <div className="text-center py-8 sm:py-12">
      <div className="inline-flex p-3 mb-4 rounded-xl" style={{ backgroundColor: accentTint }}>
        <MailCheck className="h-10 w-10" style={{ color: accent }} />
      </div>
      <h2 className="text-2xl font-bold" style={{ color: '#1C1917' }}>Check your email to finish</h2>
      <p className="mt-3 text-gray-600 max-w-md mx-auto leading-relaxed">
        Thanks, {name}. We sent a confirmation link to <strong>{email}</strong>. Your application is
        not reviewed until you click it. The link works for 48 hours.
      </p>

      <ol className="mt-7 mx-auto max-w-md space-y-3 text-left">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-lg border p-3" style={{ borderColor: '#E5E0DB', backgroundColor: '#FAFAF9' }}>
            <span
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold" style={{ color: '#1C1917' }}>{step.title}</span>
              <span className="block text-sm text-gray-600">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 text-sm text-gray-600">
        {resend === 'sent' ? (
          <p className="inline-flex items-center gap-1.5 font-semibold" style={{ color: accent }}>
            <CheckCircle className="h-4 w-4" /> If that address has an application waiting, a new link is on its way.
          </p>
        ) : (
          <>
            Nothing arrived? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resend === 'sending'}
              className="font-semibold underline underline-offset-2 disabled:opacity-60"
              style={{ color: accent }}
            >
              {resend === 'sending' ? 'sending…' : 'send the link again'}
            </button>
            .
            {resend === 'failed' && <span className="block text-rose-600">Could not send it. Please try again shortly.</span>}
          </>
        )}
      </div>

      <div className="mt-5 inline-flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-xs" style={{ borderColor: '#E5E0DB', backgroundColor: '#FAFAF9' }}>
        <span className="text-gray-500 uppercase tracking-[0.18em] font-semibold">Reference</span>
        <span className="font-mono text-sm font-semibold" style={{ color: '#1C1917' }}>{reference.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white text-sm rounded-lg"
          style={{ backgroundColor: '#1C1917' }}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
