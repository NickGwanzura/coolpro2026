import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { occupationalAccidents } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { OccupationalAccident } from '@/types/index';

const REPORTER_ROLES = ['technician', 'trainer', 'lecturer', 'student', 'org_admin'];

function toOccupationalAccident(row: typeof occupationalAccidents.$inferSelect): OccupationalAccident {
  return {
    id: row.id,
    technicianId: row.technicianId,
    date: row.date,
    jobSite: row.jobSite,
    clientName: row.clientName,
    severity: row.severity,
    description: row.description,
    technicianName: row.technicianName,
    refrigerantInvolved: row.refrigerantInvolved ?? undefined,
    nearMissFlag: row.nearMissFlag,
    nouNotified: row.nouNotified,
    rootCause: row.rootCause ?? undefined,
    investigationDate: row.investigationDate ?? undefined,
    investigatorName: row.investigatorName ?? undefined,
    correctiveActions: row.correctiveActions ?? undefined,
    preventiveMeasures: row.preventiveMeasures ?? undefined,
    status: row.status,
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, REPORTER_ROLES);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(occupationalAccidents).orderBy(desc(occupationalAccidents.date))
      : await db
          .select()
          .from(occupationalAccidents)
          .where(eq(occupationalAccidents.technicianId, session.id))
          .orderBy(desc(occupationalAccidents.date));

  return NextResponse.json(rows.map(toOccupationalAccident));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, REPORTER_ROLES);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<OccupationalAccident>;

  if (!body.date || !body.jobSite || !body.clientName || !body.severity || !body.description) {
    return NextResponse.json(
      { error: 'date, jobSite, clientName, severity, and description are required' },
      { status: 400 }
    );
  }

  const [inserted] = await db
    .insert(occupationalAccidents)
    .values({
      technicianId: session.id,
      technicianName: session.name,
      date: body.date,
      jobSite: body.jobSite,
      clientName: body.clientName,
      severity: body.severity as typeof occupationalAccidents.$inferInsert['severity'],
      description: body.description,
      refrigerantInvolved: body.refrigerantInvolved,
      nearMissFlag: body.nearMissFlag ?? false,
      nouNotified: body.nouNotified ?? false,
    })
    .returning();

  return NextResponse.json(toOccupationalAccident(inserted), { status: 201 });
}
