import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { tradePermits } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { requireApprovedSupplier } from '@/lib/server/supplier-access';
import type { TradePermit } from '@/types/index';
import { toTradePermit } from '@/lib/server/request-serializers';

function permitNumber() {
  return `PMT-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(tradePermits).orderBy(desc(tradePermits.submittedAt))
      : await db
          .select()
          .from(tradePermits)
          .where(
            // Filter by email OR vendor id to handle email changes gracefully
            sql`${tradePermits.applicantEmail} = ${session.email} OR ${tradePermits.applicantEmail} = ANY(
              SELECT email FROM supplier_applications WHERE id = ${session.id}::uuid AND status = 'approved'
            )`
          )
          .orderBy(desc(tradePermits.submittedAt));

  return NextResponse.json(rows.map(toTradePermit));
}

export async function POST(req: Request) {
  let session;
  try {
    session = await requireApprovedSupplier(req);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<TradePermit>;

  const required: Array<keyof TradePermit> = [
    'permitType', 'applicantCompany', 'refrigerantLabel', 'quantityKg', 'countryOfOriginOrDestination',
  ];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const [inserted] = await db
    .insert(tradePermits)
    .values({
      permitNumber: permitNumber(),
      permitType: body.permitType!,
      applicantName: session.name,
      applicantCompany: body.applicantCompany!,
      applicantEmail: session.email,
      refrigerantId: body.refrigerantId ?? null,
      refrigerantLabel: body.refrigerantLabel!,
      quantityKg: body.quantityKg!.toString(),
      countryOfOriginOrDestination: body.countryOfOriginOrDestination!,
      status: 'pending',
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json(toTradePermit(inserted), { status: 201 });
}
