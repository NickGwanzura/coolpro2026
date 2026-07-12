import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationAuditLog } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { AuditLogEntry } from '@/types/index';

function toAuditLogEntry(row: typeof applicationAuditLog.$inferSelect): AuditLogEntry {
  return {
    id: row.id,
    entityType: row.entityType as AuditLogEntry['entityType'],
    entityId: row.entityId,
    action: row.action,
    previousStatus: row.previousStatus ?? undefined,
    newStatus: row.newStatus ?? undefined,
    performedBy: row.performedBy,
    performedByRole: row.performedByRole ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get('entityType');
  const entityId = url.searchParams.get('entityId');

  const conditions = [];
  if (entityType) conditions.push(eq(applicationAuditLog.entityType, entityType));
  if (entityId) conditions.push(eq(applicationAuditLog.entityId, entityId));

  const rows = await db
    .select()
    .from(applicationAuditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applicationAuditLog.createdAt));

  return NextResponse.json(rows.map(toAuditLogEntry));
}
