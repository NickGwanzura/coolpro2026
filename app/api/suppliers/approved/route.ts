import { NextResponse } from 'next/server';
import { eq, sql, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications, supplierLedger } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ApprovedSupplier } from '@/types/index';

async function toApprovedSupplier(row: typeof supplierApplications.$inferSelect): Promise<ApprovedSupplier> {
  const refrigerants = (row.refrigerantsSupplied as string[]).length > 0 ? (row.refrigerantsSupplied as string[]) : ['R-290'];

  // Compute total sales from the ledger (sum of sale-direction entries for this supplier)
  const salesResult = await db
    .select({ total: sql<number>`COALESCE(SUM(quantity_kg), 0)` })
    .from(supplierLedger)
    .where(
      and(
        eq(supplierLedger.supplierEmail, row.email),
        eq(supplierLedger.direction, 'sale'),
      )
    );

  const totalSalesKg = Number(salesResult[0]?.total ?? 0);

  // Default import quota — in production this would come from NOU permit data.
  // Using 1000 kg as a sensible default so NOU flags can fire for heavy users.
  const importQuotaKg = 1000;

  const usagePercent = importQuotaKg > 0 ? Math.round((totalSalesKg / importQuotaKg) * 100) : 0;
  const quotaStatus: ApprovedSupplier['quotaStatus'] =
    usagePercent >= 100 ? 'exceeded'
    : usagePercent >= 80 ? 'near-limit'
    : 'within-quota';

  return {
    id: row.id,
    name: row.tradingName || row.companyName,
    refrigerants,
    totalSalesKg,
    importQuotaKg,
    usagePercent,
    quotaStatus,
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

  const suppliers = await Promise.all(rows.map(toApprovedSupplier));
  return NextResponse.json(suppliers);
}
