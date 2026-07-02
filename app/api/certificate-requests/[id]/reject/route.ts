import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toTrainerCertificateRequest } from '../../route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [updated] = await db
    .update(trainerCertificateRequests)
    .set({ status: 'rejected', reviewedAt: new Date(), adminReviewer: session.name })
    .where(eq(trainerCertificateRequests.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toTrainerCertificateRequest(updated));
}
