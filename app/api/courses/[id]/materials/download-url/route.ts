import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';
import { createMaterialDownloadUrl } from '@/lib/server/r2';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = (session.role === 'lecturer' || session.role === 'trainer') && row.lecturerId === session.id;
  const isAdmin = session.role === 'org_admin';
  const isEnrolledStudent = session.role === 'student' && row.status === 'approved';
  if (!isOwner && !isAdmin && !isEnrolledStudent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { r2Key?: string };
  if (!body.r2Key || !body.r2Key.startsWith(`courses/${id}/`)) {
    return NextResponse.json({ error: 'Invalid r2Key' }, { status: 400 });
  }

  const downloadUrl = await createMaterialDownloadUrl(body.r2Key);
  return NextResponse.json({ downloadUrl });
}
