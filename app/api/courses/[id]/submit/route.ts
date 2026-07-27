import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toManagedCourse, validateCourseBasics, validateCourseModules } from '../../course-validation';

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
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Can only submit draft or rejected courses.' }, { status: 409 });
  }
  const basics = validateCourseBasics(row);
  if (basics.error) return NextResponse.json({ error: basics.error }, { status: 400 });
  const modulesResult = validateCourseModules(row.modules);
  if (modulesResult.error) return NextResponse.json({ error: modulesResult.error }, { status: 400 });

  const [updated] = await db
    .update(courses)
    .set({ status: 'pending_nou', rejectionReason: null, modules: modulesResult.modules!, updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json(toManagedCourse(updated));
}
