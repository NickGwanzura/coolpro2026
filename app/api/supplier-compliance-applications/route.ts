import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierComplianceApplications } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
import type { SupplierComplianceApplication } from '@/types/index';

function toSupplierComplianceApplication(row: typeof supplierComplianceApplications.$inferSelect): SupplierComplianceApplication {
  return {
    id: row.id,
    supplierEmail: row.supplierEmail,
    supplierName: row.supplierName,
    certificateType: row.certificateType as SupplierComplianceApplication['certificateType'],
    monthCoverage: row.monthCoverage,
    sitesCovered: Number(row.sitesCovered),
    contactPerson: row.contactPerson,
    supportingSummary: row.supportingSummary,
    status: row.status as SupplierComplianceApplication['status'],
    submittedAt: row.submittedAt.toISOString(),
    notes: row.notes ?? undefined,
  };
}

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role === 'vendor') {
    const rows = await db
      .select()
      .from(supplierComplianceApplications)
      .where(eq(supplierComplianceApplications.supplierEmail, session.email));
    return NextResponse.json(rows.map(toSupplierComplianceApplication));
  }

  if (session.role === 'org_admin' || session.role === 'regulator') {
    const rows = await db.select().from(supplierComplianceApplications);
    return NextResponse.json(rows.map(toSupplierComplianceApplication));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as Partial<SupplierComplianceApplication>;

  if (!body.certificateType || !body.monthCoverage) {
    return NextResponse.json({ error: 'certificateType and monthCoverage are required' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(supplierComplianceApplications)
    .values({
      supplierEmail: session.email,
      supplierName: session.name,
      certificateType: body.certificateType as typeof supplierComplianceApplications.$inferInsert['certificateType'],
      monthCoverage: body.monthCoverage,
      sitesCovered: String(body.sitesCovered ?? 1),
      contactPerson: body.contactPerson ?? session.name,
      supportingSummary: body.supportingSummary ?? '',
      status: 'submitted',
      notes: body.notes,
      submittedAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(toSupplierComplianceApplication(inserted), { status: 201 });
}
