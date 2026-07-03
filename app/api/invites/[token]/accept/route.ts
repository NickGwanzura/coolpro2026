import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites, users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import { hashPassword, isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from '@/lib/server/password';
import type { UserSession } from '@/lib/session-types';

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

  const [existingUser] = await db.select().from(users).where(eq(users.email, invite.email)).limit(1);
  if (existingUser) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      region: invite.region,
      status: 'active',
      isDemo: false,
    })
    .returning();

  await db
    .update(invites)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(invites.id, invite.id));

  const session: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserSession['role'],
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
