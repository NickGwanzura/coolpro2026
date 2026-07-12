import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { EmailLogEntry } from '@/types/index';

const MAX_RESULTS = 500;

function toEmailLogEntry(row: typeof emailLog.$inferSelect): EmailLogEntry {
  return {
    id: row.id,
    emailType: row.emailType,
    recipientEmail: row.recipientEmail,
    relatedEntityType: row.relatedEntityType ?? undefined,
    relatedEntityId: row.relatedEntityId ?? undefined,
    status: row.status as EmailLogEntry['status'],
    errorMessage: row.errorMessage ?? undefined,
    sentAt: row.sentAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db
    .select()
    .from(emailLog)
    .orderBy(desc(emailLog.sentAt))
    .limit(MAX_RESULTS);

  return NextResponse.json(rows.map(toEmailLogEntry));
}
