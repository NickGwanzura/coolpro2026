import { NextResponse } from 'next/server';
import { sendContactEmails } from '@/lib/server/email';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECTS = new Set(['membership', 'supplier', 'training', 'compliance', 'enterprise', 'other']);
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CONTENT_LENGTH = 16 * 1024;

const SUBJECT_LABELS: Record<string, string> = {
  membership: 'Membership enquiry',
  supplier: 'Supplier onboarding',
  training: 'Training booking',
  compliance: 'Compliance / NOU',
  enterprise: 'Enterprise sales',
  other: 'Other',
};

export async function POST(req: Request) {
  if (!checkRateLimit(`contact:${getClientIp(req)}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(CONTACT_RATE_WINDOW_MS / 1000) } },
    );
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: 'Message is too large' }, { status: 413 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'name, email, subject, and message are required' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (name.length > 120 || email.length > 254 || message.length > 5000) {
    return NextResponse.json({ error: 'One or more fields exceed the allowed length' }, { status: 400 });
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
