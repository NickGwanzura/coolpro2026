import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tradePermits } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { TradePermit } from '@/types/index';

function permitNumber() {
  return `PMT-${Date.now().toString(36).toUpperCase()}`;
}

export function toTradePermit(row: typeof tradePermits.$inferSelect): TradePermit {
  return {
    id: row.id,
    permitNumber: row.permitNumber,
    permitType: row.permitType as TradePermit['permitType'],
    applicantName: row.applicantName,
    applicantCompany: row.applicantCompany,
    applicantEmail: row.applicantEmail,
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantLabel: row.refrigerantLabel,
    quantityKg: Number(row.quantityKg),
    countryOfOriginOrDestination: row.countryOfOriginOrDestination,
    status: row.status as TradePermit['status'],
    issuedDate: row.issuedDate ?? undefined,
    expiryDate: row.expiryDate ?? undefined,
    verificationToken: row.verificationToken ?? undefined,
    verificationUrl:
      row.verificationToken && row.status === 'approved'
        ? `/verify-permit?q=${encodeURIComponent(row.permitNumber)}&token=${row.verificationToken}`
        : undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    notes: row.notes ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(tradePermits).orderBy(desc(tradePermits.submittedAt))
      : await db
          .select()
          .from(tradePermits)
          .where(eq(tradePermits.applicantEmail, session.email))
          .orderBy(desc(tradePermits.submittedAt));

  return NextResponse.json(rows.map(toTradePermit));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor']);
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
