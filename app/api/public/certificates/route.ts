import { NextResponse } from 'next/server';
import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import type { CertificateRecord } from '@/types/index';

function toCertificateRecord(row: typeof trainerCertificateRequests.$inferSelect): CertificateRecord | null {
  if (!row.certificateNumber || !row.verificationToken || !row.issuedAt) return null;

  const expiry = new Date(row.issuedAt);
  expiry.setFullYear(expiry.getFullYear() + 2);

  return {
    id: row.id,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    certificateNumber: row.certificateNumber,
    certificateType: row.courseTitle,
    issuingBody: 'HEVACRAZ',
    issueDate: row.issuedAt.toISOString(),
    expiryDate: expiry.toISOString(),
    verificationToken: row.verificationToken,
    verificationUrl: `/verify-technician?mode=certificate&q=${encodeURIComponent(row.certificateNumber)}&token=${row.verificationToken}`,
    status: expiry.getTime() < Date.now() ? 'expired' : 'valid',
  };
}

// Public certificate verification lookup — only ever returns issued certificates.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const token = url.searchParams.get('token');

  const conditions = [eq(trainerCertificateRequests.status, 'issued')];
  if (q) {
    conditions.push(
      or(
        ilike(trainerCertificateRequests.certificateNumber, `%${q}%`),
        eq(trainerCertificateRequests.verificationToken, q),
      )!,
    );
  }
  if (token) {
    conditions.push(eq(trainerCertificateRequests.verificationToken, token));
  }

  const rows = await db
    .select()
    .from(trainerCertificateRequests)
    .where(and(...conditions))
    .limit(200);

  return NextResponse.json(rows.map(toCertificateRecord).filter((r): r is CertificateRecord => r !== null));
}
