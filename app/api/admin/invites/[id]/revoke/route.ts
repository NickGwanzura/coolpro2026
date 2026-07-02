import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending invites can be revoked' }, { status: 400 });
  }

  const [updated] = await db
    .update(invites)
    .set({ status: 'revoked' })
    .where(eq(invites.id, id))
    .returning();

  return NextResponse.json(updated);
}
