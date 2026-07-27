import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites, users } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sendInviteEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { SITE_URL } from '@/lib/site-url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Supplier access is invitation-only. The invitee supplies their company and compliance
 * answers after accepting the secure link; admins only identify the intended recipient.
 */
export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string; region?: string };

  const email = String(body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const region = String(body.region ?? '').trim();
  if (!region) return NextResponse.json({ error: 'Region is required' }, { status: 400 });

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });

  await db.update(invites).set({ status: 'expired' })
    .where(and(eq(invites.status, 'pending'), lt(invites.expiresAt, new Date())));
  const [pendingInvite] = await db.select({ id: invites.id }).from(invites)
    .where(and(eq(invites.email, email), eq(invites.status, 'pending'))).limit(1);
  if (pendingInvite) return NextResponse.json({ error: 'A pending invite already exists for that email' }, { status: 409 });

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invites).values({
    email,
    role: 'vendor',
    region,
    token,
    invitedBy: session.email,
    expiresAt,
  });

  const inviteUrl = `${SITE_URL}/accept-invite?token=${token}`;
  const emailResult = await sendInviteEmail({ email, inviteUrl, role: 'vendor', invitedBy: session.name });
  await logEmail({
    emailType: 'account_activation', recipientEmail: email, relatedEntityType: 'supplier_invite',
    relatedEntityId: email, sent: emailResult.sent,
  }).catch(() => {});

  return NextResponse.json({
    inviteUrl,
    emailSent: emailResult.sent,
  }, { status: 201 });
}
