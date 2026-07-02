import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tradePermits } from '@/db/schema/index';

// Public permit verification lookup — only ever returns approved permits, and only the
// fields relevant to confirming legitimacy (no applicant email, no internal review notes).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const token = url.searchParams.get('token');

  if (!q && !token) {
    return NextResponse.json({ error: 'q or token is required' }, { status: 400 });
  }

  const conditions = [eq(tradePermits.status, 'approved')];
  if (q) conditions.push(eq(tradePermits.permitNumber, q.trim().toUpperCase()));
  if (token) conditions.push(eq(tradePermits.verificationToken, token));

  const [row] = await db.select().from(tradePermits).where(and(...conditions)).limit(1);

  if (!row) {
    return NextResponse.json({ error: 'No approved permit matches that reference.' }, { status: 404 });
  }

  return NextResponse.json({
    permitNumber: row.permitNumber,
    permitType: row.permitType,
    applicantCompany: row.applicantCompany,
    refrigerantLabel: row.refrigerantLabel,
    quantityKg: Number(row.quantityKg),
    countryOfOriginOrDestination: row.countryOfOriginOrDestination,
    status: row.status,
    issuedDate: row.issuedDate,
    expiryDate: row.expiryDate,
  });
}
