import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { rewardRedemptions } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { computeTechnicianRewardSummary, computeVendorRewardSummary } from '@/lib/server/rewards';
import { TECHNICIAN_REWARDS, VENDOR_REWARDS } from '@/constants/rewards';
import type { RewardRedemption } from '@/types/index';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

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

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(rewardRedemptions).orderBy(desc(rewardRedemptions.requestedAt))
      : await db
          .select()
          .from(rewardRedemptions)
          .where(eq(rewardRedemptions.userId, session.id))
          .orderBy(desc(rewardRedemptions.requestedAt));

  return NextResponse.json(rows.map(toRewardRedemption));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'vendor']);
  } catch (e) {
    return e as Response;
  }

  if (!checkRateLimit(`reward-redemption:${session.id}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many redemption requests. Try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as { rewardId?: string };
  const catalog = session.role === 'vendor' ? VENDOR_REWARDS : TECHNICIAN_REWARDS;
  const reward = catalog.find(r => r.id === body.rewardId);
  if (!reward) {
    return NextResponse.json({ error: 'Unknown rewardId' }, { status: 400 });
  }

  const summary = session.role === 'vendor'
    ? await computeVendorRewardSummary(session.id, session.email)
    : await computeTechnicianRewardSummary(session.id);
  if (summary.availablePoints < reward.points) {
    return NextResponse.json(
      { error: `Not enough points. Available: ${summary.availablePoints}, required: ${reward.points}.` },
      { status: 400 }
    );
  }

  const [inserted] = await db
    .insert(rewardRedemptions)
    .values({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.role as typeof rewardRedemptions.$inferInsert['userRole'],
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsCost: reward.points,
      status: 'requested',
      requestedAt: new Date(),
    })
    .returning();

  return NextResponse.json(toRewardRedemption(inserted), { status: 201 });
}
