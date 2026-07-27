import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sendInviteEmail } from '@/lib/server/email';
import { SITE_URL } from '@/lib/site-url';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (error) {
    return error as Response;
  }
  const { id } = await params;
  const [invite] = await db.select().from(invites).where(and(eq(invites.id, id), eq(invites.role, 'vendor'))).limit(1);
  if (!invite) return NextResponse.json({ error: 'Supplier invite not found' }, { status: 404 });
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Only a pending supplier invite can be resent' }, { status: 400 });

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const [replacement] = await db.update(invites).set({ token, expiresAt, invitedBy: session.email })
    .where(eq(invites.id, invite.id)).returning();
  const inviteUrl = `${SITE_URL}/accept-invite?token=${token}`;
  const emailResult = await sendInviteEmail({ email: invite.email, inviteUrl, role: 'vendor', invitedBy: session.name });
  return NextResponse.json({ invite: replacement, inviteUrl, emailSent: emailResult.sent });
}
