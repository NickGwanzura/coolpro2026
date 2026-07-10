import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/server/auth';
import { computeTechnicianRewardSummary, computeVendorRewardSummary } from '@/lib/server/rewards';

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const requestedTechnicianId = url.searchParams.get('technicianId');

  if (session.role === 'technician') {
    const summary = await computeTechnicianRewardSummary(session.id);
    return NextResponse.json(summary);
  }

  if (session.role === 'vendor') {
    const summary = await computeVendorRewardSummary(session.id, session.email);
    return NextResponse.json(summary);
  }

  if (session.role === 'org_admin') {
    if (!requestedTechnicianId) {
      return NextResponse.json({ error: 'technicianId is required for admin lookups' }, { status: 400 });
    }
    const summary = await computeTechnicianRewardSummary(requestedTechnicianId);
    return NextResponse.json(summary);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
