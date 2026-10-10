import { NextResponse } from 'next/server';
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { escapeLike, parseEmailLogQuery } from '@/lib/email-log-query';
import { canResend, EMAIL_STATUSES, type EmailStatus } from '@/lib/email-status';
import type { EmailLogEntry } from '@/types/index';

const SUMMARY_DAYS = 30;

function toEmailLogEntry(row: typeof emailLog.$inferSelect): EmailLogEntry {
  return {
    id: row.id,
    emailType: row.emailType,
    recipientEmail: row.recipientEmail,
    subject: row.subject ?? undefined,
    relatedEntityType: row.relatedEntityType ?? undefined,
    relatedEntityId: row.relatedEntityId ?? undefined,
    relatedLabel: row.relatedLabel ?? undefined,
    status: row.status as EmailLogEntry['status'],
    errorMessage: row.errorMessage ?? undefined,
    sentAt: row.sentAt.toISOString(),
    statusUpdatedAt: row.statusUpdatedAt?.toISOString() ?? undefined,
    canResend: canResend(row.emailType, row.status) && Boolean(row.relatedEntityType && row.relatedEntityId),
  };
}

/** Administrators: the email activity, filtered and paged in the database, with a 30-day summary. */
export async function GET(req: Request) {
  try {
    await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const query = parseEmailLogQuery(new URL(req.url).searchParams);

  const conditions: Array<SQL | undefined> = [
    query.status === 'problems'
      ? inArray(emailLog.status, ['failed', 'bounced', 'complained'])
      : query.status
        ? eq(emailLog.status, query.status)
        : undefined,
    query.type ? eq(emailLog.emailType, query.type) : undefined,
    query.from ? gte(emailLog.sentAt, query.from) : undefined,
    query.to ? lte(emailLog.sentAt, query.to) : undefined,
    query.search
      ? or(
          ilike(emailLog.recipientEmail, `%${escapeLike(query.search)}%`),
          ilike(emailLog.subject, `%${escapeLike(query.search)}%`),
          ilike(emailLog.relatedLabel, `%${escapeLike(query.search)}%`),
        )
      : undefined,
  ];
  const where = and(...conditions);
  const since = new Date(Date.now() - SUMMARY_DAYS * 24 * 60 * 60 * 1000);

  const [rows, totalRows, summaryRows, typeRows] = await Promise.all([
    db.select().from(emailLog).where(where).orderBy(desc(emailLog.sentAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(emailLog).where(where),
    db.select({ status: emailLog.status, total: count() }).from(emailLog).where(gte(emailLog.sentAt, since)).groupBy(emailLog.status),
    db.selectDistinct({ type: emailLog.emailType }).from(emailLog).orderBy(sql`${emailLog.emailType}`),
  ]);

  const summary: Record<EmailStatus, number> = { sent: 0, delayed: 0, delivered: 0, failed: 0, bounced: 0, complained: 0 };
  for (const row of summaryRows) {
    if ((EMAIL_STATUSES as readonly string[]).includes(row.status)) summary[row.status as EmailStatus] = Number(row.total);
  }

  return NextResponse.json({
    items: rows.map(toEmailLogEntry),
    total: Number(totalRows[0]?.total ?? 0),
    page: query.page,
    pageSize: query.pageSize,
    summary: { days: SUMMARY_DAYS, ...summary },
    types: typeRows.map((row) => row.type),
  });
}
