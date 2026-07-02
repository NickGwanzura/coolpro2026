import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ApprovedSupplier } from '@/types/index';

function toApprovedSupplier(row: typeof supplierApplications.$inferSelect): ApprovedSupplier {
  const refrigerants = (row.refrigerantsSupplied as string[]).length > 0 ? (row.refrigerantsSupplied as string[]) : ['R-290'];
  return {
    id: row.id,
    name: row.tradingName || row.companyName,
    refrigerants,
    totalSalesKg: 0,
    importQuotaKg: 0,
    usagePercent: 0,
    quotaStatus: 'within-quota',
    nouApproved: true,
    region: row.province,
  };
}

// Any authenticated role can look up the approved-supplier directory — technicians need it
// to select a verified supplier when logging refrigerant purchases.
export async function GET(req: Request) {
  try {
    requireRole(req, ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db
    .select()
    .from(supplierApplications)
    .where(eq(supplierApplications.status, 'approved'));

  return NextResponse.json(rows.map(toApprovedSupplier));
}
