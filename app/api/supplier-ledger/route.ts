import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierLedger } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
import type { SupplierLedgerEntry } from '@/types/index';

function toSupplierLedgerEntry(row: typeof supplierLedger.$inferSelect): SupplierLedgerEntry {
  return {
    id: row.id,
    supplierId: row.supplierId ?? undefined,
    supplierEmail: row.supplierEmail,
    supplierName: row.supplierName,
    direction: row.direction as SupplierLedgerEntry['direction'],
    technicianId: row.technicianId ?? undefined,
    technicianRegistrationNumber: row.technicianRegistrationNumber ?? undefined,
    counterpartyName: row.counterpartyName,
    counterpartyCompany: row.counterpartyCompany ?? undefined,
    counterpartyType: row.counterpartyType as SupplierLedgerEntry['counterpartyType'],
    province: row.province,
    refrigerant: row.refrigerant,
    quantityKg: Number(row.quantityKg),
    unitPriceUsd: Number(row.unitPriceUsd),
    totalValueUsd: Number(row.totalValueUsd),
    invoiceNumber: row.invoiceNumber,
    transactionDate: row.transactionDate.toISOString(),
    referenceMonth: row.referenceMonth,
    reportedToNou: row.reportedToNou,
    clientReported: row.clientReported,
    notes: row.notes ?? undefined,
  };
}

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const supplierId = url.searchParams.get('supplierId');

  if (session.role === 'vendor') {
    const rows = await db
      .select()
      .from(supplierLedger)
      .where(eq(supplierLedger.supplierEmail, session.email));
    return NextResponse.json(rows.map(toSupplierLedgerEntry));
  }

  if (session.role === 'org_admin' || session.role === 'regulator') {
    if (supplierId) {
      const rows = await db
        .select()
        .from(supplierLedger)
        .where(eq(supplierLedger.supplierEmail, supplierId));
      return NextResponse.json(rows.map(toSupplierLedgerEntry));
    }
    const rows = await db.select().from(supplierLedger);
    return NextResponse.json(rows.map(toSupplierLedgerEntry));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin', 'vendor']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as Partial<SupplierLedgerEntry> & { supplier_id?: string };

  // Vendors can only log entries for themselves; org_admin may supply any email.
  const supplierEmail = session.role === 'vendor' ? session.email : (body.supplierEmail ?? session.email);
  const supplierName  = session.role === 'vendor' ? session.name  : (body.supplierName  ?? session.name);

  if (!supplierEmail || !body.direction || !body.counterpartyName || !body.refrigerant) {
    return NextResponse.json(
      { error: 'direction, counterpartyName, and refrigerant are required' },
      { status: 400 }
    );
  }

  const [inserted] = await db
    .insert(supplierLedger)
    .values({
      supplierId: body.supplierId,
      supplierEmail,
      supplierName: supplierName ?? '',
      direction: body.direction as typeof supplierLedger.$inferInsert['direction'],
      technicianId: body.technicianId,
      technicianRegistrationNumber: body.technicianRegistrationNumber,
      counterpartyName: body.counterpartyName,
      counterpartyCompany: body.counterpartyCompany,
      counterpartyType: (body.counterpartyType ?? 'distributor') as typeof supplierLedger.$inferInsert['counterpartyType'],
      province: body.province ?? '',
      refrigerant: body.refrigerant,
      quantityKg: String(body.quantityKg ?? 0),
      unitPriceUsd: String(body.unitPriceUsd ?? 0),
      totalValueUsd: String(body.totalValueUsd ?? 0),
      invoiceNumber: body.invoiceNumber ?? '',
      transactionDate: body.transactionDate ? new Date(body.transactionDate) : new Date(),
      referenceMonth: body.referenceMonth ?? new Date().toISOString().slice(0, 7),
      reportedToNou: body.reportedToNou ?? false,
      clientReported: body.clientReported ?? false,
      notes: body.notes,
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(toSupplierLedgerEntry(inserted), { status: 201 });
}
