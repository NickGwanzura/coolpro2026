import { NextResponse } from 'next/server';
import { sendContactEmails } from '@/lib/server/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECTS = new Set(['membership', 'supplier', 'training', 'compliance', 'enterprise', 'other']);

const SUBJECT_LABELS: Record<string, string> = {
  membership: 'Membership enquiry',
  supplier: 'Supplier onboarding',
  training: 'Training booking',
  compliance: 'Compliance / NOU',
  enterprise: 'Enterprise sales',
  other: 'Other',
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const subject = body.subject?.trim();
  const message = body.message?.trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'name, email, subject, and message are required' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (!SUBJECTS.has(subject)) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
  }

  const result = await sendContactEmails({
    name,
    email,
    subject: SUBJECT_LABELS[subject],
    message,
  });

  if (!result.sent) {
    return NextResponse.json({ error: 'Email service unavailable' }, { status: 503 });
  }

  return NextResponse.json({ sent: true });
}
