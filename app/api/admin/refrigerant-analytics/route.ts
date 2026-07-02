import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import {
  getMostUsedRefrigerants,
  getMostInstalledRefrigerants,
  getMostRecoveredRefrigerants,
  getClassificationBreakdown,
  getMonthlyUsageTrend,
} from '@/lib/whatgas/analytics';

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const [mostUsed, mostInstalled, mostRecovered, classificationBreakdown, monthlyTrend] = await Promise.all([
    getMostUsedRefrigerants(10),
    getMostInstalledRefrigerants(10),
    getMostRecoveredRefrigerants(10),
    getClassificationBreakdown(),
    getMonthlyUsageTrend(),
  ]);

  return NextResponse.json({ mostUsed, mostInstalled, mostRecovered, classificationBreakdown, monthlyTrend });
}
