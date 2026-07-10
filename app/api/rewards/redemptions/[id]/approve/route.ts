import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { rewardRedemptions } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { RewardRedemption } from '@/types/index';

function toRewardRedemption(row: typeof rewardRedemptions.$inferSelect): RewardRedemption {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    userRole: row.userRole,
    rewardId: row.rewardId,
    rewardTitle: row.rewardTitle,
    pointsCost: row.pointsCost,
    status: row.status as RewardRedemption['status'],
    requestedAt: row.requestedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? undefined,
    resolvedBy: row.resolvedBy ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.status !== 'requested') {
    return NextResponse.json({ error: `Cannot fulfill a redemption in status "${row.status}"` }, { status: 400 });
  }

  const [updated] = await db
    .update(rewardRedemptions)
    .set({ status: 'fulfilled', resolvedAt: new Date(), resolvedBy: session.name })
    .where(eq(rewardRedemptions.id, id))
    .returning();

  return NextResponse.json(toRewardRedemption(updated));
}
