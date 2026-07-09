import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import { verifyPassword } from '@/lib/server/password';
import type { UserSession } from '@/lib/session-types';

function toUserSession(user: typeof users.$inferSelect, region?: string): UserSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserSession['role'],
    region: region ?? user.region,
    isDemo: user.isDemo,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    email?: string;
    password?: string;
  };
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  let user: typeof users.$inferSelect | undefined;
  try {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
  } catch (err) {
    console.error('[auth/login] DB lookup failed');
    return NextResponse.json({ error: 'Login service unavailable' }, { status: 500 });
  }

  // Generic error for both "no such user" and "wrong password" to avoid leaking
  // which emails are registered.
  const invalidCredentials = () =>
    NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  if (!user || !user.passwordHash) {
    return invalidCredentials();
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return invalidCredentials();
  }

  if (user.status !== 'active') {
    return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
  }

  const sessionPayload = {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    region: user.region,
  };

  const token = signSession(sessionPayload);

  return NextResponse.json(
    { user: toUserSession(user) },
    { status: 200, headers: { 'Set-Cookie': sessionCookie(token) } },
  );
}
