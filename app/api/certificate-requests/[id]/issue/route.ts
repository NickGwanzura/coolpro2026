import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toTrainerCertificateRequest } from '../../route';

function generateCertificateNumber() {
  return `HEV-${Date.now().toString().slice(-6)}`;
}

function generateVerificationToken() {
  return `verify-${randomBytes(8).toString('hex')}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db
    .select()
    .from(trainerCertificateRequests)
    .where(eq(trainerCertificateRequests.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(trainerCertificateRequests)
    .set({
      status: 'issued',
      issuedAt: new Date(),
      certificateNumber: existing.certificateNumber ?? generateCertificateNumber(),
      verificationToken: existing.verificationToken ?? generateVerificationToken(),
      cpdCredits: existing.cpdCredits ?? 12,
    })
    .where(eq(trainerCertificateRequests.id, id))
    .returning();

  return NextResponse.json(toTrainerCertificateRequest(updated));
}
