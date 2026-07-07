import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { deleteMaterial } from '@/lib/server/r2';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // kept for signature compatibility
  try {
    requireRole(req, ['trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as { r2Key?: string };
  const { r2Key } = body;

  if (!r2Key) {
    return NextResponse.json({ error: 'r2Key is required' }, { status: 400 });
  }

  try {
    await deleteMaterial(r2Key);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('Failed to delete material from R2:', err);
    return NextResponse.json({ error: 'Failed to delete material from storage' }, { status: 500 });
  }
}
