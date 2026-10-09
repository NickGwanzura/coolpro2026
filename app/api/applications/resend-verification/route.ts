import { NextResponse } from 'next/server';
import { latestPendingForEmail } from '@/lib/server/email-verification';
import { resendApplicantVerification } from '@/lib/server/application-flow';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends a fresh confirmation link to an applicant who has lost theirs. The answer is always the
 * same, so this cannot be used to find out which email addresses have applied.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const generic = NextResponse.json({ ok: true });

  if (!EMAIL_RE.test(email) || email.length > 254) return generic;
  if (
    !checkRateLimit(`resend-verification:ip:${getClientIp(req)}`, 5, 15 * 60 * 1000) ||
    !checkRateLimit(`resend-verification:email:${email}`, 3, 60 * 60 * 1000)
  ) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const [latest] = await latestPendingForEmail(email);
  if (latest) await resendApplicantVerification(latest.entityType, latest.entityId).catch(() => false);
  return generic;
}
