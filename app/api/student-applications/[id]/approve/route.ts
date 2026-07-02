import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { studentApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication } from '@/lib/server/provision-user';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db
    .select()
    .from(studentApplications)
    .where(eq(studentApplications.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(studentApplications)
    .set({ status: 'approved', reviewedBy: session.name, reviewedAt: new Date() })
    .where(eq(studentApplications.id, id))
    .returning();

  await provisionUserFromApplication({
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    passwordHash: row.passwordHash,
    role: 'student',
    region: row.polytech,
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
  });
}
