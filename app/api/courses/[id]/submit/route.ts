import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ManagedCourse } from '@/lib/platformStore';

function toManagedCourse(row: typeof courses.$inferSelect): ManagedCourse {
  return {
    id: row.id,
    lecturerId: row.lecturerId,
    lecturerName: row.lecturerName,
    title: row.title,
    description: row.description,
    modules: row.modules as ManagedCourse['modules'],
    status: row.status as ManagedCourse['status'],
    rejectionReason: row.rejectionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.lecturerId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [updated] = await db
    .update(courses)
    .set({ status: 'pending_nou', updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json(toManagedCourse(updated));
}
