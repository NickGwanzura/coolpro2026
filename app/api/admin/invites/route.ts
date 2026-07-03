import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites, users } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sendInviteEmail } from '@/lib/server/email';
import { VALID_ROLES, type ValidRole } from '@/lib/roles';

const INVITE_TTL_DAYS = 7;

function generateInviteToken() {
  return randomBytes(24).toString('base64url');
}

function inviteUrl(req: Request, token: string) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/accept-invite?token=${token}`;
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as {
    email?: string;
    role?: string;
    region?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const role = body.role;
  const region = body.region?.trim();

  if (!email || !role || !region) {
    return NextResponse.json({ error: 'email, role, and region are required' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role as ValidRole)) {
    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const [existingInvite] = await db
    .select()
    .from(invites)
    .where(eq(invites.email, email))
    .limit(1);
  if (existingInvite && existingInvite.status === 'pending') {
    return NextResponse.json({ error: 'A pending invite already exists for that email' }, { status: 409 });
  }

  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const [invite] = await db
    .insert(invites)
    .values({
      email,
      role: role as ValidRole,
      region,
      token,
      invitedBy: session.email,
      expiresAt,
    })
    .returning();

  const url = inviteUrl(req, token);
  const emailResult = await sendInviteEmail({ email, inviteUrl: url, role, invitedBy: session.name });

  return NextResponse.json({ invite, inviteUrl: url, emailSent: emailResult.sent }, { status: 201 });
}

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db.select().from(invites).orderBy(desc(invites.createdAt));
  return NextResponse.json({ data: rows });
}
