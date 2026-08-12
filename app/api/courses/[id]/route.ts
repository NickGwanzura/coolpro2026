import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses, examSubmissions } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { deleteMaterial } from '@/lib/server/r2';
import type { ManagedCourse } from '@/lib/platformStore';
import { toManagedCourse, validateCourseBasics, validateCourseModules } from '../course-validation';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'org_admin', 'student']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if ((session.role === 'lecturer' || session.role === 'trainer') && row.lecturerId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (session.role === 'student' && row.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(toManagedCourse(row));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.role !== 'org_admin' && row.lecturerId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Can only edit draft or rejected courses' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({})) as Partial<Pick<ManagedCourse, 'title' | 'description' | 'modules'>>;
  const patch: Partial<typeof courses.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined || body.description !== undefined) {
    const basics = validateCourseBasics({
      title: body.title ?? row.title,
      description: body.description ?? row.description,
    });
    if (basics.error) return NextResponse.json({ error: basics.error }, { status: 400 });
    patch.title = basics.title;
    patch.description = basics.description;
  }
  if (body.modules !== undefined) {
    const modulesResult = validateCourseModules(body.modules);
    if (modulesResult.error) return NextResponse.json({ error: modulesResult.error }, { status: 400 });
    patch.modules = modulesResult.modules;
  }

  const [updated] = await db.update(courses).set(patch).where(eq(courses.id, id)).returning();
  return NextResponse.json(toManagedCourse(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['lecturer', 'trainer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = (session.role === 'lecturer' || session.role === 'trainer') && row.lecturerId === session.id;
  if (!isOwner && session.role !== 'org_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (session.role !== 'org_admin' && row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Only draft or rejected courses can be deleted by their owner.' }, { status: 409 });
  }

  const submissions = await db
    .select({ id: examSubmissions.id })
    .from(examSubmissions)
    .where(eq(examSubmissions.courseId, id))
    .limit(1);
  if (submissions.length > 0) {
    return NextResponse.json({ error: 'This course cannot be deleted because it has exam submissions.' }, { status: 409 });
  }

  const attachmentKeys = Array.isArray(row.modules)
    ? row.modules.flatMap(module => {
        if (!module || typeof module !== 'object') return [];
        const attachments = (module as { attachments?: unknown }).attachments;
        if (!Array.isArray(attachments)) return [];
        return attachments.flatMap(attachment => {
          if (!attachment || typeof attachment !== 'object') return [];
          const r2Key = (attachment as { r2Key?: unknown }).r2Key;
          return typeof r2Key === 'string' && r2Key.startsWith(`courses/${id}/`) ? [r2Key] : [];
        });
      })
    : [];

  await db.delete(courses).where(eq(courses.id, id));
  await Promise.allSettled(attachmentKeys.map(key => deleteMaterial(key)));

  return NextResponse.json({ deleted: true, id });
}
