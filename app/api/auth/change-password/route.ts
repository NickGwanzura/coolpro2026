import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import {
  hashPassword,
  verifyPassword,
  isPasswordStrongEnough,
} from '@/lib/server/password';
import { recordAuditEvent } from '@/lib/server/audit';

/**
 * Self-service password change. Requires the caller to be authenticated and
 * to prove their current password. On success the new password is persisted
 * (bcrypt-hashed) and an `applicationAuditLog` row is written so every reset
 * is auditable — subject (entityId) and performer are the same user for a
 * self-service change.
 */
export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, [
      'technician',
      'trainer',
      'lecturer',
      'vendor',
      'org_admin',
      'student',
    ]);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current and new password are required' },
      { status: 400 },
    );
  }

  if (!isPasswordStrongEnough(newPassword)) {
    return NextResponse.json(
      { error: `New password must be at least ${8} characters` },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const currentMatches = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    // Wrong current password — log the attempt for audit so failed resets leave a trail.
    await recordAuditEvent({
      entityType: 'user',
      entityId: user.id,
      action: 'password_reset_attempt',
      previousStatus: 'changed',
      newStatus: 'failed',
      performedBy: session.email,
      performedByRole: session.role,
      notes: 'Password reset rejected: current password did not verify.',
    });
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'New password must differ from the current password' },
      { status: 400 },
    );
  }

  const newHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await recordAuditEvent({
    entityType: 'user',
    entityId: user.id,
    action: 'password_reset',
    previousStatus: 'active',
    newStatus: 'active',
    performedBy: session.email,
    performedByRole: session.role,
    notes: 'Self-service password reset succeeded.',
  });

  return NextResponse.json({ ok: true });
}
