import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ManagedCourse } from '@/lib/platformStore';
import { toManagedCourse, validateCourseBasics, validateCourseModules } from './course-validation';

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'org_admin', 'student', 'technician']);
  } catch (e) {
    return e as Response;
  }

  let rows: (typeof courses.$inferSelect)[];

  if (session.role === 'lecturer' || session.role === 'trainer') {
    rows = await db.select().from(courses).where(eq(courses.lecturerId, session.id));
  } else if (session.role === 'student' || session.role === 'technician') {
    rows = await db.select().from(courses).where(eq(courses.status, 'approved'));
  } else {
    rows = await db.select().from(courses);
  }

  return NextResponse.json(rows.map(toManagedCourse));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Omit<ManagedCourse, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
  const basics = validateCourseBasics(body);
  if (basics.error) return NextResponse.json({ error: basics.error }, { status: 400 });
  const modulesResult = validateCourseModules(body.modules);
  if (modulesResult.error) return NextResponse.json({ error: modulesResult.error }, { status: 400 });

  const now = new Date();

  const [inserted] = await db
    .insert(courses)
    .values({
      lecturerId: session.id,
      lecturerName: session.name,
      title: basics.title!,
      description: basics.description!,
      modules: modulesResult.modules!,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(toManagedCourse(inserted), { status: 201 });
}
