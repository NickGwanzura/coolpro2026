import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cocRequests, installations } from '@/db/schema/index';
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
  if (existing.status !== 'submitted') {
    return NextResponse.json({ error: 'Only submitted COC requests can be approved.' }, { status: 409 });
  }
  if (!existing.complianceCheck) {
    return NextResponse.json({ error: 'COC request is missing the technician compliance confirmation.' }, { status: 400 });
  }

  const [updated] = await db
    .update(cocRequests)
    .set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      issuedDate: new Date().toISOString().slice(0, 10),
      reviewNote: null,
      verificationToken: existing.verificationToken ?? generateVerificationToken(),
    })
    .where(eq(cocRequests.id, id))
    .returning();

  if (updated.installationId) {
    await db
      .update(installations)
      .set({
        status: 'approved',
        cocRequested: true,
        cocApproved: true,
        cocRequestId: updated.id,
        cocApprovalDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(installations.id, updated.installationId));
  }

  return NextResponse.json(toCocRequest(updated));
}
