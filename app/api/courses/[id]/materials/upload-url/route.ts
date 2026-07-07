import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { buildCourseMaterialKey, createMaterialUploadUrl } from '@/lib/server/r2';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB, covers course video uploads

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
    return NextResponse.json({ error: 'Can only add materials to draft or rejected courses' }, { status: 409 });
  }

  const body = await req.json() as { fileName?: string; fileType?: string; sizeBytes?: number };
  if (!body.fileName || !body.fileType || !body.sizeBytes) {
    return NextResponse.json({ error: 'fileName, fileType, and sizeBytes are required' }, { status: 400 });
  }
  if (body.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 500MB limit' }, { status: 400 });
  }

  const r2Key = buildCourseMaterialKey(id, body.fileName);
  const uploadUrl = await createMaterialUploadUrl(r2Key, body.fileType);

  return NextResponse.json({ uploadUrl, r2Key });
}
