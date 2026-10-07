import { NextResponse } from 'next/server';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationAuditLog } from '@/db/schema/audit';
import { passwordResetTokens } from '@/db/schema/password-reset';
import { users } from '@/db/schema/users';
import { clearSessionCookie } from '@/lib/server/auth';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { hashPasswordResetToken } from '@/lib/server/password-reset';
import { hashPassword, isPasswordStrongEnough } from '@/lib/server/password';

export async function POST(req: Request) {
  if (!checkRateLimit(`password-reset-complete:${getClientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as { token?: unknown; newPassword?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!token || token.length > 128 || !newPassword) {
    return NextResponse.json({ error: 'The reset link is invalid or expired.' }, { status: 400 });
  }
  if (!isPasswordStrongEnough(newPassword)) {
    return NextResponse.json({ error: 'Password must be between 8 and 72 UTF-8 bytes.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  const tokenHash = hashPasswordResetToken(token);
  const now = new Date();

  try {
    const updated = await db.transaction(async (tx) => {
      const [reset] = await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ))
        .returning({ userId: passwordResetTokens.userId });

      if (!reset) return false;

      const [user] = await tx
        .update(users)
        .set({
          passwordHash,
          updatedAt: now,
          sessionVersion: sql`${users.sessionVersion} + 1`,
        })
        .where(and(eq(users.id, reset.userId), eq(users.status, 'active')))
        .returning({ id: users.id, email: users.email, role: users.role });

      if (!user) return false;

      await tx.insert(applicationAuditLog).values({
        entityType: 'user',
        entityId: user.id,
        action: 'password_reset',
        previousStatus: 'active',
        newStatus: 'active',
        performedBy: user.email,
        performedByRole: user.role,
        notes: 'Password reset completed using a single-use email token.',
      });
      return true;
    });

    if (!updated) {
      return NextResponse.json({ error: 'The reset link is invalid or expired.' }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Set-Cookie': clearSessionCookie() } },
    );
  } catch (error) {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'unknown';
    console.error('[auth/password-reset] Completion failed:', { errorCode });
    return NextResponse.json({ error: 'Unable to reset the password right now.' }, { status: 500 });
  }
}
