import { NextResponse } from 'next/server';
import { completeApplicantVerification } from '@/lib/server/application-flow';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

/** Called by the /verify-email page when an applicant opens the link in their confirmation email. */
export async function POST(req: Request) {
  if (!checkRateLimit(`verify-email:${getClientIp(req)}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const outcome = await completeApplicantVerification(token);
  return NextResponse.json(outcome, { status: outcome.state === 'invalid' ? 400 : 200 });
}
