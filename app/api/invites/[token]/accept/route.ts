import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import { hashPassword, isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from '@/lib/server/password';
import type { UserSession } from '@/lib/session-types';

type AcceptedInviteUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserSession['role'];
  region: string;
  isDemo: boolean;
};

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybe = err as { code?: string; cause?: { code?: string } };
  return maybe.code === '23505' || maybe.cause?.code === '23505';
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({})) as { name?: string; password?: string };
  const name = body.name?.trim();
  const password = body.password;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!password || !isPasswordStrongEnough(password)) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
  }

  const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.status === 'pending' && invite.expiresAt < new Date()) {
    await db.update(invites).set({ status: 'expired' }).where(eq(invites.id, invite.id));
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: `This invite is ${invite.status}` }, { status: 410 });
  }

  const passwordHash = await hashPassword(password);

  let user: AcceptedInviteUserRow | undefined;
  try {
    const result = await db.execute(sql<AcceptedInviteUserRow>`
      WITH claimed_invite AS (
        UPDATE invites
        SET status = 'accepted', accepted_at = now()
        WHERE token = ${token}
          AND status = 'pending'
          AND expires_at >= now()
        RETURNING email, role, region
      ),
      created_user AS (
        INSERT INTO users (name, email, password_hash, role, region, status, is_demo)
        SELECT ${name}, email, ${passwordHash}, role, region, 'active', false
        FROM claimed_invite
        RETURNING id, name, email, role, region, is_demo
      )
      SELECT
        id,
        name,
        email,
        role,
        region,
        is_demo AS "isDemo"
      FROM created_user
    `);
    user = (result.rows as AcceptedInviteUserRow[])[0];
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }
    throw err;
  }

  if (!user) {
    return NextResponse.json({ error: 'This invite is no longer available' }, { status: 410 });
  }

  const session: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    region: user.region,
    isDemo: user.isDemo,
  };

  const sessionToken = signSession({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    region: user.region,
  });

  return NextResponse.json(
    { user: session },
    { status: 201, headers: { 'Set-Cookie': sessionCookie(sessionToken) } },
  );
}
