import { NextResponse } from 'next/server';
import { eq, ilike, or, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicians } from '@/db/schema/index';
import type { Technician } from '@/types/index';

// /verify-technician fetches the unfiltered listing once and matches against it entirely
// client-side (see findVerificationResult) — it is not a paginated browse view. A cap here
// doesn't reduce what's exposed (contact details are already stripped from bulk listings
// below) or add real scraping resistance (an unbounded ?q= search already allows full
// enumeration); it only risks silently hiding real technicians from verification once the
// registry grows past it, with no deterministic ordering to make the cutoff predictable.
// Kept generous rather than removed so a single malformed client request can't ask for an
// unbounded response.
const MAX_RESULTS = 5000;

// Public-facing technician lookup for the certificate verification portal.
// Bulk/search listings never include contact details (email, phone) — those are only
// returned for a single technician fetched by exact id, to prevent this endpoint being
// used to scrape the entire directory's contact information.
function toPublicTechnician(row: typeof technicians.$inferSelect, includeContact: boolean): Technician {
  return {
    id: row.id,
    name: row.name,
    nationalId: '',
    registrationNumber: row.registrationNumber,
    region: row.region,
    province: row.province,
    district: row.district,
    contactNumber: includeContact ? row.contactNumber : '',
    email: includeContact ? row.email ?? undefined : undefined,
    specialization: row.specialization,
    certifications: row.certifications as Technician['certifications'],
    trainingHistory: [],
    employmentStatus: row.employmentStatus as Technician['employmentStatus'],
    employer: row.employer ?? undefined,
    refrigerantsHandled: row.refrigerantsHandled as string[],
    registrationDate: row.registrationDate,
    expiryDate: row.expiryDate,
    status: row.status as Technician['status'],
    lastRenewalDate: row.lastRenewalDate ?? undefined,
    nextRenewalDate: row.nextRenewalDate ?? undefined,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const q = url.searchParams.get('q');

  if (id) {
    const [row] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toPublicTechnician(row, true));
  }

  if (q) {
    const rows = await db
      .select()
      .from(technicians)
      .where(or(ilike(technicians.name, `%${q}%`), ilike(technicians.registrationNumber, `%${q}%`)))
      .orderBy(asc(technicians.registrationNumber))
      .limit(MAX_RESULTS);
    return NextResponse.json(rows.map((row) => toPublicTechnician(row, false)));
  }

  const rows = await db.select().from(technicians).orderBy(asc(technicians.registrationNumber)).limit(MAX_RESULTS);
  return NextResponse.json(rows.map((row) => toPublicTechnician(row, false)));
}
