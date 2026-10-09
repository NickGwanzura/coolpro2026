import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { findBrokenAttachments } from '@/lib/server/course-materials';
import { toManagedCourse, validateCourseBasics, validateCourseModules } from '../../course-validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['lecturer', 'trainer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.role !== 'org_admin' && row.lecturerId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Can only submit draft or rejected courses.' }, { status: 409 });
  }
  const basics = validateCourseBasics(row);
  if (basics.error) return NextResponse.json({ error: basics.error }, { status: 400 });
  const modulesResult = validateCourseModules(row.modules, id);
  if (modulesResult.error) return NextResponse.json({ error: modulesResult.error }, { status: 400 });

  let broken: string[];
  try {
    broken = await findBrokenAttachments(modulesResult.modules!);
  } catch (err) {
    console.error('Failed to verify course materials in storage:', err);
    return NextResponse.json({ error: 'Could not verify the uploaded files. Please try again.' }, { status: 502 });
  }
  if (broken.length > 0) {
    return NextResponse.json(
      { error: `These files did not finish uploading or were changed: ${broken.join(', ')}. Remove and upload them again.` },
      { status: 409 },
    );
  }

  const [updated] = await db
    .update(courses)
    .set({ status: 'pending_nou', rejectionReason: null, modules: modulesResult.modules!, updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json(toManagedCourse(updated));
}
