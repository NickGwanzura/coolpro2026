import { and, asc, count, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationDocuments } from '@/db/schema/index';
import { documentSlotsLeft, safeDocumentName } from '@/lib/application-documents';
import { describeApplication } from '@/lib/server/application-flow';
import { lookupVerificationToken, type ApplicationEntityType } from '@/lib/server/email-verification';
import { matchesDeclaredType, SIGNATURE_BYTES_NEEDED } from '@/lib/server/file-signatures';
import type { ApplicantRole } from '@/lib/application-roles';

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface UploadSession {
  entityType: ApplicationEntityType;
  entityId: string;
  role: ApplicantRole;
}

/**
 * Who may upload: the holder of a confirmation-link token (it proves they own the email address),
 * for an application that is still open. Returns a message when they may not.
 */
export async function resolveUploadSession(token: string): Promise<{ session: UploadSession } | { error: string; status: number }> {
  const found = await lookupVerificationToken(token);
  if (!found) return { error: 'This link is not valid. Use the link in your confirmation email.', status: 401 };
  const application = await describeApplication(found.entityType, found.entityId);
  if (!application) return { error: 'We could not find that application.', status: 404 };
  if (application.status !== 'submitted' && application.status !== 'under-review') {
    return { error: 'This application has already been decided, so documents can no longer be added.', status: 409 };
  }
  return { session: { entityType: found.entityType, entityId: found.entityId, role: application.role } };
}

const summaryColumns = {
  id: applicationDocuments.id,
  fileName: applicationDocuments.fileName,
  fileType: applicationDocuments.fileType,
  sizeBytes: applicationDocuments.sizeBytes,
  uploadedAt: applicationDocuments.uploadedAt,
};

export async function listApplicationDocuments(entityType: string, entityId: string): Promise<DocumentSummary[]> {
  const rows = await db
    .select(summaryColumns)
    .from(applicationDocuments)
    .where(and(eq(applicationDocuments.entityType, entityType), eq(applicationDocuments.entityId, entityId)))
    .orderBy(asc(applicationDocuments.uploadedAt));
  return rows.map((row) => ({ ...row, uploadedAt: row.uploadedAt.toISOString() }));
}

/** Stores one uploaded file after checking its real contents match what it claims to be. */
export async function addApplicationDocument(
  session: UploadSession,
  file: { name: string; type: string; data: Buffer },
): Promise<{ document: DocumentSummary } | { error: string; status: number }> {
  if (!matchesDeclaredType(file.data.subarray(0, SIGNATURE_BYTES_NEEDED), file.type)) {
    return { error: 'That file does not look like a real PDF, JPG or PNG. Please upload the original file.', status: 400 };
  }
  const [{ total }] = await db
    .select({ total: count() })
    .from(applicationDocuments)
    .where(and(eq(applicationDocuments.entityType, session.entityType), eq(applicationDocuments.entityId, session.entityId)));
  if (documentSlotsLeft(Number(total)) === 0) {
    return { error: 'You have reached the limit of documents for this application. Remove one to add another.', status: 409 };
  }
  const [row] = await db
    .insert(applicationDocuments)
    .values({
      entityType: session.entityType,
      entityId: session.entityId,
      fileName: safeDocumentName(file.name),
      fileType: file.type,
      sizeBytes: file.data.length,
      data: file.data,
    })
    .returning(summaryColumns);
  return { document: { ...row, uploadedAt: row.uploadedAt.toISOString() } };
}

export async function removeApplicationDocument(session: UploadSession, documentId: string): Promise<boolean> {
  const removed = await db
    .delete(applicationDocuments)
    .where(and(
      eq(applicationDocuments.id, documentId),
      eq(applicationDocuments.entityType, session.entityType),
      eq(applicationDocuments.entityId, session.entityId),
    ))
    .returning({ id: applicationDocuments.id });
  return removed.length > 0;
}

/** Administrators only: the stored file itself. */
export async function getApplicationDocumentFile(documentId: string) {
  const [row] = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, documentId)).limit(1);
  return row ?? null;
}
