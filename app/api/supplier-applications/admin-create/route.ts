import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { supplierApplications, invites } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication, ProvisionConflictError } from '@/lib/server/provision-user';
import { generateSupplierRegistrationNumber } from '@/lib/server/registration-number';
import { sendInviteEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { SITE_URL } from '@/lib/site-url';
import type { SupplierRegistration, SupplierSurveyData } from '@/types/index';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin-only "Direct Entry" for suppliers — mirrors the student and technician equivalents.
 * No applicant-chosen password (self-signup is closed): account provisioned as pending,
 * activated via the existing secure invite-link flow.
 */
export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = (await req.json().catch(() => ({}))) as Partial<SupplierRegistration> & {
    companyName?: string; contactName?: string; email?: string; phone?: string;
    province?: string; city?: string; address?: string;
    surveyData?: SupplierSurveyData;
  };

  const required = ['companyName', 'contactName', 'email', 'phone', 'province', 'city', 'address'] as const;
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} is required` }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const registrationNumber = await generateSupplierRegistrationNumber();

  const [inserted] = await db
    .insert(supplierApplications)
    .values({
      companyName: String(body.companyName).trim(),
      tradingName: body.tradingName ?? null,
      registrationNumber,
      supplierType: (body.supplierType ?? 'distributor') as SupplierRegistration['supplierType'],
      contactName: String(body.contactName).trim(),
      email,
      passwordHash: null,
      phone: String(body.phone).trim(),
      province: String(body.province).trim(),
      city: String(body.city).trim(),
      address: String(body.address).trim(),
      refrigerantsSupplied: body.refrigerantsSupplied ?? [],
      taxNumber: body.taxNumber ?? null,
      website: body.website ?? null,
      notes: body.notes ?? null,
      surveyData: body.surveyData ?? null,
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
    })
    .returning();

  try {
    await provisionUserFromApplication({
      name: inserted.contactName,
      email,
      passwordHash: null,
      role: 'vendor',
      region: inserted.province,
    });
  } catch (err) {
    if (err instanceof ProvisionConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invites).values({
    email,
    role: 'vendor',
    region: inserted.province,
    token,
    invitedBy: session.email,
    expiresAt,
  }).catch(() => {});

  const inviteUrl = `${SITE_URL}/accept-invite?token=${token}`;
  sendInviteEmail({ email, inviteUrl, role: 'vendor', invitedBy: session.name })
    .then((result) => logEmail({
      emailType: 'account_activation',
      recipientEmail: email,
      relatedEntityType: 'supplier_application',
      relatedEntityId: inserted.id,
      sent: result.sent,
    }))
    .catch(() => {});

  return NextResponse.json({
    id: inserted.id,
    status: inserted.status,
    registrationNumber: inserted.registrationNumber,
  }, { status: 201 });
}
