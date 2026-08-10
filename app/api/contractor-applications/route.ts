import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { contractorApplications } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
import type { ContractorApplication } from '@/types/index';

function toContractorApplication(row: typeof contractorApplications.$inferSelect): ContractorApplication {
  return {
    id: row.id,
    email: row.email,
    companyName: row.companyName ?? undefined,
    contactName: row.contactName ?? undefined,
    phone: row.phone ?? undefined,
    region: row.region,
    tradeSpecialization: row.tradeSpecialization ?? undefined,
    yearsInOperation: row.yearsInOperation ?? undefined,
    teamSize: row.teamSize ?? undefined,
    servicesOffered: (row.servicesOffered as string[]) ?? [],
    hasSafetyCertification: row.hasSafetyCertification ?? undefined,
    biggestChallenge: row.biggestChallenge ?? undefined,
    invitedBy: row.invitedBy,
    status: row.status as ContractorApplication['status'],
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    submittedAt: row.submittedAt?.toISOString() ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

// Admin directory listing.
export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db.select().from(contractorApplications).orderBy(desc(contractorApplications.createdAt));
  return NextResponse.json(rows.map(toContractorApplication));
}

// Self-submission of the onboarding questionnaire by the now-authenticated contractor.
export async function PATCH(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session || session.role !== 'contractor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [existing] = await db.select().from(contractorApplications).where(eq(contractorApplications.email, session.email)).limit(1);
  if (!existing) return NextResponse.json({ error: 'No contractor invite found for this account' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Partial<ContractorApplication>;

  const required: Array<keyof ContractorApplication> = ['companyName', 'contactName', 'phone', 'tradeSpecialization', 'yearsInOperation', 'teamSize', 'hasSafetyCertification'];
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} is required` }, { status: 400 });
  }
  if (!body.servicesOffered || body.servicesOffered.length === 0) {
    return NextResponse.json({ error: 'Select at least one service offered' }, { status: 400 });
  }

  const [updated] = await db
    .update(contractorApplications)
    .set({
      companyName: body.companyName,
      contactName: body.contactName,
      phone: body.phone,
      tradeSpecialization: body.tradeSpecialization,
      yearsInOperation: body.yearsInOperation,
      teamSize: body.teamSize,
      servicesOffered: body.servicesOffered,
      hasSafetyCertification: body.hasSafetyCertification,
      biggestChallenge: body.biggestChallenge ?? null,
      status: 'submitted',
      submittedAt: new Date(),
    })
    .where(eq(contractorApplications.email, session.email))
    .returning();

  return NextResponse.json(toContractorApplication(updated));
}
