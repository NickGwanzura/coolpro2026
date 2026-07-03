import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import { verifyPassword } from '@/lib/server/password';
import { VALID_ROLES, type ValidRole } from '@/lib/roles';
import type { UserSession } from '@/lib/session-types';

const DEMO_LOGIN_ENABLED = process.env.ENABLE_DEMO_LOGIN === 'true';

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
    role?: string;
    region?: string;
    email?: string;
    password?: string;
  };
  const { role, region, email, password } = body;

  // Demo persona quick-login: never available in production, and only when explicitly
  // opted into via ENABLE_DEMO_LOGIN. Bypasses password by design, so it must only ever
  // touch rows that are themselves flagged isDemo in the database.
  if (role && !email) {
    if (!DEMO_LOGIN_ENABLED) {
      return NextResponse.json({ error: 'Demo login is disabled' }, { status: 403 });
    }
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
    }

    let demoUser: typeof users.$inferSelect | undefined;
    try {
      [demoUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, role as ValidRole))
        .limit(1);
    } catch (err) {
      console.error('[auth/login] demo lookup failed');
      return NextResponse.json({ error: 'Login service unavailable' }, { status: 500 });
    }

    if (!demoUser || !demoUser.isDemo) {
      return NextResponse.json({ error: 'No demo account for that role' }, { status: 404 });
    }

    const token = signSession({
      id: demoUser.id,
      role: demoUser.role,
      email: demoUser.email,
      name: demoUser.name,
      region: region ?? demoUser.region,
    });

    return NextResponse.json(
      { user: toUserSession(demoUser, region) },
      { status: 200, headers: { 'Set-Cookie': sessionCookie(token) } },
    );
  }

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
    region: region ?? user.region,
  };

  const token = signSession(sessionPayload);

  return NextResponse.json(
    { user: toUserSession(user, region) },
    { status: 200, headers: { 'Set-Cookie': sessionCookie(token) } },
  );
}
