import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cocRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toCocRequest } from '../../route';

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
  const [existing] = await db.select().from(cocRequests).where(eq(cocRequests.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(cocRequests)
    .set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      issuedDate: new Date().toISOString().slice(0, 10),
      verificationToken: existing.verificationToken ?? generateVerificationToken(),
    })
    .where(eq(cocRequests.id, id))
    .returning();

  return NextResponse.json(toCocRequest(updated));
}
