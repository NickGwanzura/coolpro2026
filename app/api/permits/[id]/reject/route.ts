import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tradePermits } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toTradePermit } from '../../route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { notes?: string };

  const [updated] = await db
    .update(tradePermits)
    .set({ status: 'rejected', reviewedBy: session.name, reviewedAt: new Date(), reviewNote: body.notes ?? null })
    .where(eq(tradePermits.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toTradePermit(updated));
}
