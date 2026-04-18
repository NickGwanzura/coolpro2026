import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { signSession, sessionCookie } from '@/lib/server/auth';
import type { UserSession } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json() as { role?: string; region?: string };
  const { role, region } = body;

  if (!role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.role, role as typeof users.$inferSelect.role))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'No demo user found for this role' }, { status: 404 });
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
