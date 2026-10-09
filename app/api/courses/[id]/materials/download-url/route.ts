import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';
import { isFieldWorkerRole } from '@/lib/field-worker';
import { createMaterialDownloadUrl } from '@/lib/server/r2';
import { findAttachment } from '../../../course-validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = (session.role === 'lecturer' || session.role === 'trainer') && row.lecturerId === session.id;
  const isAdmin = session.role === 'org_admin';
  const isLearner = (session.role === 'student' || isFieldWorkerRole(session.role)) && row.status === 'approved';
  if (!isOwner && !isAdmin && !isLearner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { r2Key?: string };
  if (!body.r2Key || !body.r2Key.startsWith(`courses/${id}/`)) {
    return NextResponse.json({ error: 'Invalid r2Key' }, { status: 400 });
  }
  const attachment = findAttachment(row.modules, body.r2Key);
  if (!attachment) {
    return NextResponse.json({ error: 'Course material is not attached to this course' }, { status: 404 });
  }

  const downloadUrl = await createMaterialDownloadUrl(body.r2Key, attachment.fileName);
  return NextResponse.json({ downloadUrl });
}
