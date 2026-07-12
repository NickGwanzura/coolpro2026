import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { buildTechnicianPhotoKey, createMaterialUploadUrl } from '@/lib/server/r2';

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB, generous for a headshot photo
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select({ id: technicians.id }).from(technicians).where(eq(technicians.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { fileName?: string; fileType?: string; sizeBytes?: number };
  if (!body.fileName || !body.fileType || !body.sizeBytes) {
    return NextResponse.json({ error: 'fileName, fileType, and sizeBytes are required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(body.fileType)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP photos are allowed' }, { status: 400 });
  }
  if (body.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Photo exceeds the 3MB limit' }, { status: 400 });
  }

  const r2Key = buildTechnicianPhotoKey(id, body.fileName);
  const uploadUrl = await createMaterialUploadUrl(r2Key, body.fileType);

  return NextResponse.json({ uploadUrl, r2Key });
}
