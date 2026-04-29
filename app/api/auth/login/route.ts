import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import type { UserSession } from '@/lib/auth';

const VALID_ROLES = ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'regulator'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { role?: string; region?: string; email?: string };
  const { role, region, email } = body;

  if (!role && !email) {
    return NextResponse.json({ error: 'email or role is required' }, { status: 400 });
  }

  let user: typeof users.$inferSelect | undefined;
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
    return NextResponse.json({ error: 'Login service unavailable' }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'No matching user found' }, { status: 401 });
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
