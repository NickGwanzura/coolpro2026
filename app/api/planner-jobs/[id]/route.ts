import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { plannerJobs } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { PlannerJob } from '@/types/index';

function toPlannerJob(row: typeof plannerJobs.$inferSelect): PlannerJob {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    location: row.location,
    province: row.province,
    district: row.district ?? undefined,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    jobType: row.jobType as PlannerJob['jobType'],
    refrigerantClass: row.refrigerantClass as PlannerJob['refrigerantClass'],
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantType: row.refrigerantType ?? undefined,
    amount: row.amount ? Number(row.amount) : undefined,
    scheduledDate: row.scheduledDate,
    status: row.status as PlannerJob['status'],
    preJobChecklistComplete: row.preJobChecklistComplete,
    checklistItems: row.checklistItems as PlannerJob['checklistItems'],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<PlannerJob>;

  // Validate status transitions
  const allowedUpdates: Record<string, string[]> = {
    scheduled: ['in-progress', 'completed', 'follow-up'],
    'in-progress': ['completed', 'follow-up'],
    completed: ['follow-up'],
    'follow-up': ['completed'],
  };

  if (body.status) {
    // Fetch current job to validate transition
    const [existing] = await db
      .select()
      .from(plannerJobs)
      .where(eq(plannerJobs.id, id));

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Technicians can only update their own jobs
    if (session.role === 'technician' && existing.technicianId !== session.id) {
      return NextResponse.json({ error: 'Not authorized to update this job' }, { status: 403 });
    }

    const validNext = allowedUpdates[existing.status];
    if (!validNext || !validNext.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${existing.status}" to "${body.status}"` },
        { status: 400 },
      );
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (body.status) updateFields.status = body.status;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.checklistItems !== undefined) updateFields.checklistItems = body.checklistItems;
  if (body.preJobChecklistComplete !== undefined) updateFields.preJobChecklistComplete = body.preJobChecklistComplete;
  updateFields.updatedAt = new Date();

  const [updated] = await db
    .update(plannerJobs)
    .set(updateFields)
    .where(eq(plannerJobs.id, id))
    .returning();

  return NextResponse.json(toPlannerJob(updated));
}
