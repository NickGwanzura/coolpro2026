import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { loadApplicationCounts } from '@/lib/server/application-counts';

/** How many applications are waiting for an admin, for the sidebar badge. */
export async function GET(req: Request) {
  try {
    await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }
  return NextResponse.json(await loadApplicationCounts());
}
