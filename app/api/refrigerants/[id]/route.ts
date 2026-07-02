import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { getRefrigerantDetail } from '@/lib/whatgas/service';

const ALL_ROLES = ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ALL_ROLES);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: 'Invalid refrigerant id' }, { status: 400 });
  }

  const refrigerant = await getRefrigerantDetail(numericId);
  if (!refrigerant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(refrigerant);
}
