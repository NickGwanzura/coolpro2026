import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courseEnrollments, courseProgress, courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sanitizeCompletedModules } from '@/lib/course-progress';

/** Saves which modules a learner has ticked off. They must be enrolled in an approved course. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['student', 'technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [course] = await db.select({ status: courses.status, modules: courses.modules }).from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (course.status !== 'approved') return NextResponse.json({ error: 'This course is not open.' }, { status: 409 });

  const [enrolled] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, id), eq(courseEnrollments.userId, session.id)))
    .limit(1);
  if (!enrolled) return NextResponse.json({ error: 'Enrol in this course first.' }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { completedModules?: unknown };
  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
  const completedModules = sanitizeCompletedModules(body.completedModules, moduleCount);

  const [saved] = await db
    .insert(courseProgress)
    .values({ userId: session.id, courseId: id, completedModules, moduleCount })
    .onConflictDoUpdate({
      target: [courseProgress.userId, courseProgress.courseId],
      set: { completedModules, moduleCount, updatedAt: new Date() },
    })
    .returning();
  return NextResponse.json({ courseId: id, completedModules: saved.completedModules, moduleCount: saved.moduleCount });
}
