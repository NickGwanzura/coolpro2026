import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
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

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'regulator', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  let rows: (typeof courses.$inferSelect)[];

  if (session.role === 'lecturer' || session.role === 'trainer') {
    rows = await db.select().from(courses).where(eq(courses.lecturerId, session.id));
  } else {
    rows = await db.select().from(courses);
  }

  return NextResponse.json(rows.map(toManagedCourse));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as Omit<ManagedCourse, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
  const now = new Date();

  const [inserted] = await db
    .insert(courses)
    .values({
      lecturerId: session.id,
      lecturerName: body.lecturerName ?? session.name,
      title: body.title,
      description: body.description,
      modules: body.modules,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(toManagedCourse(inserted), { status: 201 });
}
