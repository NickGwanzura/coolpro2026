import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courseEnrollments } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

/** The signed-in learner's own enrollments. */
export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['student', 'technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db
    .select({ courseId: courseEnrollments.courseId, enrolledAt: courseEnrollments.enrolledAt })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.userId, session.id));
  return NextResponse.json(rows.map((row) => ({ courseId: row.courseId, enrolledAt: row.enrolledAt.toISOString() })));
}
