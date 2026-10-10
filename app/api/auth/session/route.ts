import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { readSessionFromRequest, sessionCookie, signSession } from '@/lib/server/auth';
import type { UserSession } from '@/lib/session-types';

export async function GET(req: Request) {
  const session = await readSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) {
    return NextResponse.json({ user: null, }, { headers: { 'Set-Cookie': 'coolpro_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' } });
  }
  if (user.status !== 'active') {
    return NextResponse.json({ user: null }, { headers: { 'Set-Cookie': 'coolpro_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' } });
  }

  const userSession: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserSession['role'],
    region: session.region ?? user.region,
    isDemo: user.isDemo,
  };

  // Sliding renewal: an active session keeps its 15-minute window instead of expiring mid-task.
  const { exp: _exp, ...claims } = session;
  return NextResponse.json({ user: userSession }, { headers: { 'Set-Cookie': sessionCookie(signSession(claims)) } });
}
