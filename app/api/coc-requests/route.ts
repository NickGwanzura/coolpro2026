import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cocRequests, installations } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toCocRequest } from '@/lib/server/request-serializers';
import type { CocRequest } from '@/types/index';

function certificateNumber() {
  return `COC-${randomBytes(12).toString('hex').toUpperCase()}`;
}

export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['technician', 'org_admin']);
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
    session = await requireRole(req, ['technician']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<CocRequest>;

  if (!body.installationId) {
    return NextResponse.json({ error: 'A saved installation is required' }, { status: 400 });
  }
  if (body.complianceCheck !== true) {
    return NextResponse.json({ error: 'Explicit compliance confirmation is required' }, { status: 400 });
  }

  let linkedInstallation: typeof installations.$inferSelect | null = null;

  {
    const [installation] = await db
      .select()
      .from(installations)
      .where(and(eq(installations.id, body.installationId), eq(installations.technicianId, session.id)))
      .limit(1);
    if (!installation) {
      return NextResponse.json({ error: 'Installation not found for this technician' }, { status: 404 });
    }
    if (installation.cocRequested) {
      return NextResponse.json({ error: 'A COC request already exists for this installation' }, { status: 409 });
    }
    const snapshot = installation.checklistSnapshot;
    if (!installation.location?.trim() || !snapshot || !Array.isArray(snapshot.items) ||
      snapshot.totalItems !== snapshot.items.length || snapshot.completedItems !== snapshot.totalItems ||
      snapshot.items.some((item) => item.checked !== true)) {
      return NextResponse.json({ error: 'Installation must have a complete, saved checklist and site location' }, { status: 400 });
    }
    linkedInstallation = installation;
  }

  let inserted: typeof cocRequests.$inferSelect;
  try {
    inserted = await db.transaction(async (tx) => {
      const [claimed] = await tx.update(installations)
        .set({ cocRequested: true, cocApproved: false, updatedAt: new Date() })
        .where(and(
          eq(installations.id, body.installationId!),
          eq(installations.technicianId, session.id),
          eq(installations.cocRequested, false),
        ))
        .returning();
      if (!claimed) throw new Error('COC_ALREADY_REQUESTED');

      const [request] = await tx.insert(cocRequests).values({
      certificateNumber: certificateNumber(),
      plannerJobId: null,
      installationId: linkedInstallation!.id,
      technicianId: session.id,
      technicianName: session.name,
      clientName: linkedInstallation!.clientName,
      location: linkedInstallation!.location!,
      equipmentType: linkedInstallation!.jobType,
      serialNumber: null,
      installationDate: linkedInstallation!.installationDate.toISOString().slice(0, 10),
      details: linkedInstallation!.jobDetails,
      checklistSnapshot: linkedInstallation!.checklistSnapshot,
      evidenceImages: linkedInstallation!.images,
      complianceCheck: true,
      status: 'submitted',
      }).returning();
      await tx.update(installations).set({ cocRequestId: request.id }).where(eq(installations.id, linkedInstallation!.id));
      return request;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'COC_ALREADY_REQUESTED') {
      return NextResponse.json({ error: 'A COC request already exists for this installation' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json(toCocRequest(inserted), { status: 201 });
}
