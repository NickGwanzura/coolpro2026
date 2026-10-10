import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courseProgress } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

/** The signed-in learner's saved progress on every course. */
export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['student', 'technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }
  const rows = await db.select().from(courseProgress).where(eq(courseProgress.userId, session.id));
  return NextResponse.json(
    rows.map((row) => ({
      courseId: row.courseId,
      completedModules: row.completedModules,
      moduleCount: row.moduleCount,
      updatedAt: row.updatedAt.toISOString(),
    })),
  );
}
