import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { deleteMaterial } from '@/lib/server/r2';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await requireRole(req, ['trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = (session.role === 'trainer' || session.role === 'lecturer') && row.lecturerId === session.id;
  if (!isOwner && session.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return NextResponse.json({ error: 'Materials can only be deleted while a course is draft or rejected.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({})) as { r2Key?: string };
  const { r2Key } = body;

  if (!r2Key || !r2Key.startsWith(`courses/${id}/`)) {
    return NextResponse.json({ error: 'Invalid r2Key' }, { status: 400 });
  }
  // The key only has to sit under this course's prefix, so an owner can also remove an uploaded
  // file that was never saved onto the course (an orphan from an abandoned upload).

  try {
    await deleteMaterial(r2Key);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('Failed to delete material from R2:', err);
    return NextResponse.json({ error: 'Failed to delete material from storage' }, { status: 500 });
  }
}
