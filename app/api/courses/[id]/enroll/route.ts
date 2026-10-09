import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses, courseEnrollments } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

/** Enrols the signed-in learner in an approved course. Safe to call twice. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['student', 'technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [course] = await db.select({ status: courses.status }).from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (course.status !== 'approved') {
    return NextResponse.json({ error: 'You can only enrol in an approved course.' }, { status: 409 });
  }

  await db.insert(courseEnrollments).values({ courseId: id, userId: session.id }).onConflictDoNothing();
  return NextResponse.json({ enrolled: true, courseId: id });
}
