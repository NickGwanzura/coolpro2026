import { NextResponse } from 'next/server';
import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { cylinders } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { Cylinder } from '@/types/index';

function toCylinder(row: typeof cylinders.$inferSelect): Cylinder {
  return {
    id: row.id,
    cylinderCode: row.cylinderCode,
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantLabel: row.refrigerantLabel,
    ownerType: row.ownerType as Cylinder['ownerType'],
    ownerId: row.ownerId ?? undefined,
    ownerName: row.ownerName,
    capacityKg: Number(row.capacityKg),
    currentFillKg: Number(row.currentFillKg),
    status: row.status as Cylinder['status'],
    province: row.province,
    lastFilledDate: row.lastFilledDate ?? undefined,
    lastInspectionDate: row.lastInspectionDate ?? undefined,
    nextInspectionDue: row.nextInspectionDue ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(cylinders).orderBy(desc(cylinders.updatedAt))
      : await db
          .select()
          .from(cylinders)
          .where(or(eq(cylinders.ownerId, session.id), eq(cylinders.ownerType, 'company')))
          .orderBy(desc(cylinders.updatedAt));

  return NextResponse.json(rows.map(toCylinder));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<Cylinder>;

  const required: Array<keyof Cylinder> = ['cylinderCode', 'refrigerantLabel', 'capacityKg'];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const ownerType: Cylinder['ownerType'] =
    body.ownerType ?? (session.role === 'vendor' ? 'supplier' : 'technician');

  const [duplicate] = await db
    .select({ id: cylinders.id })
    .from(cylinders)
    .where(eq(cylinders.cylinderCode, body.cylinderCode!))
    .limit(1);
  if (duplicate) {
    return NextResponse.json({ error: 'A cylinder with this code is already registered.' }, { status: 409 });
  }

  const [inserted] = await db
    .insert(cylinders)
    .values({
      cylinderCode: body.cylinderCode!,
      refrigerantId: body.refrigerantId ?? null,
      refrigerantLabel: body.refrigerantLabel!,
      ownerType,
      ownerId: session.id,
      ownerName: session.name,
      capacityKg: body.capacityKg!.toString(),
      currentFillKg: body.currentFillKg != null ? body.currentFillKg.toString() : '0',
      status: body.status ?? 'empty',
      province: body.province ?? session.region ?? '',
      lastFilledDate: body.lastFilledDate ?? null,
      lastInspectionDate: body.lastInspectionDate ?? null,
      nextInspectionDue: body.nextInspectionDue ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json(toCylinder(inserted), { status: 201 });
}
