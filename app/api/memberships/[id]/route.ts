import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { memberships } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import type { Membership } from '@/types/index';

function toMembership(row: typeof memberships.$inferSelect): Membership {
  return {
    id: row.id,
    technicianId: row.technicianId,
    applicationId: row.applicationId ?? undefined,
    membershipNumber: row.membershipNumber,
    membershipType: row.membershipType,
    province: row.province,
    status: row.status as Membership['status'],
    startDate: row.startDate,
    expiryDate: row.expiryDate,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt?.toISOString() ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(memberships).where(eq(memberships.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toMembership(row));
}

const RENEWABLE_STATUSES: Membership['status'][] = ['active', 'expired', 'suspended', 'revoked'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { status?: string; renew?: boolean };

  const [existing] = await db.select().from(memberships).where(eq(memberships.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.renew) {
    const nextYear = new Date().getFullYear() + 1;
    const [updated] = await db
      .update(memberships)
      .set({
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: `${nextYear}-12-31`,
        approvedBy: session.name,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, id))
      .returning();

    recordAuditEvent({
      entityType: 'membership',
      entityId: id,
      action: 'membership_renewed',
      previousStatus: existing.status,
      newStatus: 'active',
      performedBy: session.name,
      performedByRole: session.role,
    }).catch(() => {});

    return NextResponse.json(toMembership(updated));
  }

  if (body.status && RENEWABLE_STATUSES.includes(body.status as Membership['status'])) {
    const [updated] = await db
      .update(memberships)
      .set({ status: body.status as Membership['status'], updatedAt: new Date() })
      .where(eq(memberships.id, id))
      .returning();

    recordAuditEvent({
      entityType: 'membership',
      entityId: id,
      action: `membership_${body.status}`,
      previousStatus: existing.status,
      newStatus: body.status,
      performedBy: session.name,
      performedByRole: session.role,
    }).catch(() => {});

    return NextResponse.json(toMembership(updated));
  }

  return NextResponse.json({ error: 'Nothing to update — provide status or renew' }, { status: 400 });
}
