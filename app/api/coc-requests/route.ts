import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cocRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { CocRequest } from '@/types/index';

function certificateNumber() {
  return `COC-${Date.now().toString(36).toUpperCase()}`;
}

export function toCocRequest(row: typeof cocRequests.$inferSelect): CocRequest {
  return {
    id: row.id,
    certificateNumber: row.certificateNumber,
    plannerJobId: row.plannerJobId ?? undefined,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location,
    equipmentType: row.equipmentType,
    serialNumber: row.serialNumber ?? undefined,
    installationDate: row.installationDate,
    details: row.details ?? undefined,
    complianceCheck: row.complianceCheck,
    status: row.status as CocRequest['status'],
    verificationToken: row.verificationToken ?? undefined,
    verificationUrl:
      row.verificationToken && row.status === 'approved'
        ? `/verify-coc?q=${encodeURIComponent(row.certificateNumber)}&token=${row.verificationToken}`
        : undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    issuedDate: row.issuedDate ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
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
      ? await db.select().from(cocRequests).orderBy(desc(cocRequests.submittedAt))
      : await db
          .select()
          .from(cocRequests)
          .where(eq(cocRequests.technicianId, session.id))
          .orderBy(desc(cocRequests.submittedAt));

  return NextResponse.json(rows.map(toCocRequest));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<CocRequest>;

  const required: Array<keyof CocRequest> = ['clientName', 'location', 'equipmentType', 'installationDate'];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const [inserted] = await db
    .insert(cocRequests)
    .values({
      certificateNumber: certificateNumber(),
      plannerJobId: body.plannerJobId ?? null,
      technicianId: session.id,
      technicianName: session.name,
      clientName: body.clientName!,
      location: body.location!,
      equipmentType: body.equipmentType!,
      serialNumber: body.serialNumber ?? null,
      installationDate: body.installationDate!,
      details: body.details ?? null,
      complianceCheck: body.complianceCheck ?? false,
      status: 'submitted',
    })
    .returning();

  return NextResponse.json(toCocRequest(inserted), { status: 201 });
}
