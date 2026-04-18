import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(req);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;

  if (session.role !== 'org_admin' && session.id !== id) {
    return new Response('Forbidden', { status: 403 });
  }

  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    region: row.region,
    status: row.status,
    isDemo: row.isDemo,
    createdAt: row.createdAt.toISOString(),
  });
}
