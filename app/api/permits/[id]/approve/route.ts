import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tradePermits } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toTradePermit } from '../../route';

function generateVerificationToken() {
  return `verify-${randomBytes(8).toString('hex')}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db.select().from(tradePermits).where(eq(tradePermits.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const issuedDate = new Date().toISOString().slice(0, 10);
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const [updated] = await db
    .update(tradePermits)
    .set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      issuedDate,
      expiryDate: expiry.toISOString().slice(0, 10),
      verificationToken: existing.verificationToken ?? generateVerificationToken(),
    })
    .where(eq(tradePermits.id, id))
    .returning();

  return NextResponse.json(toTradePermit(updated));
}
