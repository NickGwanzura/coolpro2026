import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'regulator', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if ((session.role === 'lecturer' || session.role === 'trainer') && row.lecturerId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(toManagedCourse(row));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Can only edit draft or rejected courses' }, { status: 409 });
  }

  const body = await req.json() as Partial<Pick<ManagedCourse, 'title' | 'description' | 'modules'>>;
  const patch: Partial<typeof courses.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.modules !== undefined) patch.modules = body.modules;

  const [updated] = await db.update(courses).set(patch).where(eq(courses.id, id)).returning();
  return NextResponse.json(toManagedCourse(updated));
}
