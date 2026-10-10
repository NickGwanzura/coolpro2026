import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/users';
import { SITE_URL } from '@/lib/site-url';
import { sendPasswordResetEmail } from '@/lib/server/email';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { issuePasswordResetToken } from '@/lib/server/password-reset';

const RATE_WINDOW_MS = 30 * 60 * 1000;
const genericResponse = () => NextResponse.json({
  message: 'If an active account matches that email, a password reset link will be sent shortly.',
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`password-reset-request:ip:${ip}`, 10, RATE_WINDOW_MS)) {
    return genericResponse();
  }

  const body = await req.json().catch(() => ({})) as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return genericResponse();
  }

  const emailKey = createHash('sha256').update(email).digest('hex');
  if (!checkRateLimit(`password-reset-request:email:${emailKey}`, 3, RATE_WINDOW_MS)) {
    return genericResponse();
  }

  try {
    const [user] = await db
      .select({ id: users.id, status: users.status, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user?.status === 'active' && user.passwordHash) {
      const { token } = await issuePasswordResetToken(user.id);
      const resetUrl = new URL('/reset-password', SITE_URL);
      resetUrl.searchParams.set('token', token);
      const result = await sendPasswordResetEmail({ email, resetUrl: resetUrl.toString(), log: { entityType: 'user', entityId: user.id } });
      if (!result.sent) console.error('[auth/password-reset] Email provider did not send reset email.');
    }
  } catch (error) {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'unknown';
    console.error('[auth/password-reset] Request failed:', { errorCode });
  }

  return genericResponse();
}
