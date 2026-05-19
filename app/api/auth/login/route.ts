import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import { MOCK_USERS } from '@/lib/mock-users';
import type { UserSession } from '@/lib/mock-users';

const VALID_ROLES = ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { role?: string; region?: string; email?: string };
  const { role, region, email } = body;

  if (!role && !email) {
    return NextResponse.json({ error: 'email or role is required' }, { status: 400 });
  }

  let user: typeof users.$inferSelect | undefined;
  let dbError = false;

  try {
    if (role) {
      if (!VALID_ROLES.includes(role as ValidRole)) {
        return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
      }
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.role, role as ValidRole))
        .limit(1);
    } else if (email) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);
    }
  } catch (err) {
    console.error('[auth/login] DB lookup failed', err);
    dbError = true;
  }

  // Fallback to MOCK_USERS when DB is empty/unavailable or user not found
  // This makes demo logins resilient even if seed hasn't been run.
  if (!user) {
    const mockKey = role ?? Object.keys(MOCK_USERS).find(k => MOCK_USERS[k].email === email?.trim().toLowerCase());
    const mockUser = mockKey ? MOCK_USERS[mockKey] : undefined;

    if (mockUser) {
      const token = signSession({
        id: mockUser.id,
        role: mockUser.role,
        email: mockUser.email,
        name: mockUser.name,
        region: region ?? mockUser.region,
      });

      const userSession: UserSession = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        region: region ?? mockUser.region,
        isDemo: true,
      };

      return NextResponse.json(
        { user: userSession },
        {
          status: 200,
          headers: { 'Set-Cookie': sessionCookie(token) },
        },
      );
    }

    if (dbError) {
      return NextResponse.json({ error: 'Login service unavailable' }, { status: 500 });
    }

    return NextResponse.json({ error: 'No matching user found' }, { status: 401 });
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

  const userSession: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserSession['role'],
    region: region ?? user.region,
    isDemo: user.isDemo,
  };

  return NextResponse.json(
    { user: userSession },
    {
      status: 200,
      headers: { 'Set-Cookie': sessionCookie(token) },
    },
  );
}
