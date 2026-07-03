import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cocRequests } from '@/db/schema/index';

// Public COC verification lookup — only ever returns approved certificates, and only the
// fields relevant to confirming legitimacy (no internal review notes).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const token = url.searchParams.get('token');

  if (!q && !token) {
    return NextResponse.json({ error: 'q or token is required' }, { status: 400 });
  }

  const conditions = [eq(cocRequests.status, 'approved')];
  if (q) conditions.push(eq(cocRequests.certificateNumber, q.trim().toUpperCase()));
  if (token) conditions.push(eq(cocRequests.verificationToken, token));

  const [row] = await db.select().from(cocRequests).where(and(...conditions)).limit(1);

  if (!row) {
    return NextResponse.json({ error: 'No approved certificate matches that reference.' }, { status: 404 });
  }

  return NextResponse.json({
    certificateNumber: row.certificateNumber,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location,
    equipmentType: row.equipmentType,
    installationDate: row.installationDate,
    status: row.status,
    issuedDate: row.issuedDate,
  });
}
