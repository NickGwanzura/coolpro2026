import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { listApplicationDocuments } from '@/lib/server/application-documents';

const ENTITY_TYPES = ['technician_application', 'student_application', 'supplier_application', 'registration_application'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Administrators: the proof documents attached to one application (details only, not the files). */
export async function GET(req: Request) {
  try {
    await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }
  const url = new URL(req.url);
  const entityType = url.searchParams.get('entityType') ?? '';
  const entityId = url.searchParams.get('entityId') ?? '';
  if (!ENTITY_TYPES.includes(entityType) || !UUID.test(entityId)) {
    return NextResponse.json({ error: 'Unknown application.' }, { status: 400 });
  }
  return NextResponse.json(await listApplicationDocuments(entityType, entityId));
}
