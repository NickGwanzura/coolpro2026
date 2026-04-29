import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { studentApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  const body = (await req.json().catch(() => ({}))) as { notes?: string };

  const { id } = await params;
  const [row] = await db
    .select()
    .from(studentApplications)
    .where(eq(studentApplications.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(studentApplications)
    .set({
      status: 'rejected',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: body.notes ?? null,
    })
    .where(eq(studentApplications.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
    reviewNote: updated.reviewNote,
  });
}
