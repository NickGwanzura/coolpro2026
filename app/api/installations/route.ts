import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { installations } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { Installation } from '@/types/index';

function toInstallation(row: typeof installations.$inferSelect): Installation {
  return {
    id: row.id,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location ?? undefined,
    jobDetails: row.jobDetails,
    floorSpace: row.floorSpace ?? '',
    jobType: row.jobType as Installation['jobType'],
    installationDate: row.installationDate.toISOString(),
    equipmentId: row.equipmentId ?? undefined,
    status: row.status as Installation['status'],
    images: row.images,
    cocRequested: row.cocRequested,
    cocApproved: row.cocApproved,
    cocApprovalDate: row.cocApprovalDate?.toISOString() ?? undefined,
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(installations).orderBy(desc(installations.createdAt))
      : await db
          .select()
          .from(installations)
          .where(eq(installations.technicianId, session.id))
          .orderBy(desc(installations.createdAt));

  return NextResponse.json(rows.map(toInstallation));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<Installation>;

  if (!body.clientName || !body.jobDetails) {
    return NextResponse.json({ error: 'clientName and jobDetails are required' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(installations)
    .values({
      technicianId: session.id,
      technicianName: session.name,
      clientName: body.clientName!,
      location: body.location ?? null,
      jobDetails: body.jobDetails!,
      floorSpace: body.floorSpace ?? null,
      jobType: body.jobType ?? 'COLD_ROOM',
      installationDate: new Date(),
      status: 'pending',
      images: body.images ?? [],
      cocRequested: false,
      cocApproved: false,
      notes: null,
    })
    .returning();

  return NextResponse.json(toInstallation(inserted), { status: 201 });
}
