import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import { parseQuota } from '@/lib/supplier-quota';

/** Administrators set (or clear) an approved supplier's annual import quota in kg. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { importQuotaKg?: unknown };
  const parsed = parseQuota(body.importQuotaKg);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [before] = await db.select({ quota: supplierApplications.importQuotaKg, status: supplierApplications.status }).from(supplierApplications).where(eq(supplierApplications.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (before.status !== 'approved') return NextResponse.json({ error: 'Quotas can only be set for approved suppliers.' }, { status: 409 });

  await db.update(supplierApplications).set({ importQuotaKg: parsed.value === null ? null : String(parsed.value) }).where(eq(supplierApplications.id, id));
  await recordAuditEvent({
    entityType: 'supplier_application',
    entityId: id,
    action: 'import_quota_set',
    previousStatus: before.quota === null ? 'none' : `${before.quota} kg`,
    newStatus: parsed.value === null ? 'none' : `${parsed.value} kg`,
    performedBy: session.name,
    performedByRole: session.role,
  }).catch(() => {});
  return NextResponse.json({ id, importQuotaKg: parsed.value });
}
