import { db } from '@/db/client';
import { applicationAuditLog } from '@/db/schema/index';

export type AuditEntityType = 'technician_application' | 'membership';

export interface RecordAuditEventInput {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  performedBy: string;
  performedByRole?: string;
  notes?: string;
}

/** Single insert helper reused by every mutating route that touches an audited entity. */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  await db.insert(applicationAuditLog).values({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    previousStatus: input.previousStatus ?? null,
    newStatus: input.newStatus ?? null,
    performedBy: input.performedBy,
    performedByRole: input.performedByRole ?? null,
    notes: input.notes ?? null,
  });
}
