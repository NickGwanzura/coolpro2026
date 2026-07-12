import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications, technicians, memberships } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication, ProvisionConflictError } from '@/lib/server/provision-user';
import { sendApprovalEmail, sendMembershipConfirmationEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { recordAuditEvent } from '@/lib/server/audit';
import { generateMembershipNumber } from '@/lib/server/membership-number';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [app] = await db
    .select()
    .from(technicianApplications)
    .where(eq(technicianApplications.id, id))
    .limit(1);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (app.status === 'approved' && app.approvedTechnicianId) {
    return NextResponse.json({
      id: app.id,
      status: app.status,
      approvedTechnicianId: app.approvedTechnicianId,
    });
  }

  try {
    await provisionUserFromApplication({
      name: app.name,
      email: app.email,
      passwordHash: app.passwordHash,
      role: 'technician',
      region: app.region,
    });
  } catch (err) {
    if (err instanceof ProvisionConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const today = new Date();
  const expiry = new Date(today);
  expiry.setFullYear(today.getFullYear() + 2);

  const [createdTechnician] = await db
    .insert(technicians)
    .values({
      name: app.name,
      nationalId: app.nationalId,
      registrationNumber: app.registrationNumber,
      region: app.region,
      province: app.province,
      district: app.district,
      contactNumber: app.contactNumber,
      email: app.email,
      specialization: app.specialization,
      certifications: app.certifications ?? [],
      trainingHistory: [],
      employmentStatus: app.employmentStatus as 'employed' | 'self-employed' | 'unemployed',
      employer: app.employer,
      refrigerantsHandled: (app.refrigerantsHandled as string[]) ?? [],
      surveyData: app.surveyData ?? null,
      registrationDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'active',
    })
    .returning();

  const [updated] = await db
    .update(technicianApplications)
    .set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      approvedTechnicianId: createdTechnician.id,
    })
    .where(eq(technicianApplications.id, id))
    .returning();

  // Membership is a separate entity from technician registration — every approval creates
  // one, valid through 31 December of the year approved (calendar-year membership).
  const membershipNumber = await generateMembershipNumber();
  const membershipExpiry = `${today.getFullYear()}-12-31`;
  const [createdMembership] = await db
    .insert(memberships)
    .values({
      technicianId: createdTechnician.id,
      applicationId: app.id,
      membershipNumber,
      membershipType: 'standard',
      province: app.province,
      status: 'active',
      startDate: today.toISOString().split('T')[0],
      expiryDate: membershipExpiry,
      approvedBy: session.name,
      approvedAt: today,
    })
    .returning();

  recordAuditEvent({
    entityType: 'technician_application',
    entityId: app.id,
    action: 'approved',
    previousStatus: app.status,
    newStatus: 'approved',
    performedBy: session.name,
    performedByRole: session.role,
  }).catch(() => {});

  recordAuditEvent({
    entityType: 'membership',
    entityId: createdMembership.id,
    action: 'membership_created',
    newStatus: 'active',
    performedBy: session.name,
    performedByRole: session.role,
    notes: `Created on approval of application ${app.id}`,
  }).catch(() => {});

  // Notify the technician — best-effort, never blocks approval
  sendApprovalEmail({
    email: app.email,
    name: app.name,
    role: 'technician',
  })
    .then((result) => logEmail({
      emailType: 'application_approved',
      recipientEmail: app.email,
      relatedEntityType: 'technician_application',
      relatedEntityId: app.id,
      sent: result.sent,
    }))
    .catch(() => {});

  sendMembershipConfirmationEmail({
    email: app.email,
    name: app.name,
    membershipNumber,
    expiryDate: membershipExpiry,
  })
    .then((result) => logEmail({
      emailType: 'membership_confirmation',
      recipientEmail: app.email,
      relatedEntityType: 'membership',
      relatedEntityId: createdMembership.id,
      sent: result.sent,
    }))
    .catch(() => {});

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    approvedTechnicianId: updated.approvedTechnicianId,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
    membershipId: createdMembership.id,
    membershipNumber: createdMembership.membershipNumber,
    membershipExpiryDate: createdMembership.expiryDate,
  });
}
