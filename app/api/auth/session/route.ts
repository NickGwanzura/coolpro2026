import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';
import type { UserSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const userSession: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserSession['role'],
    region: session.region ?? user.region,
    isDemo: user.isDemo,
  };

  return NextResponse.json({ user: userSession });
}
