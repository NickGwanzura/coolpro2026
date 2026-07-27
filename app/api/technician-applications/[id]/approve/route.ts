import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications, technicians, memberships, users } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
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
  if (app.status !== 'submitted' && app.status !== 'under-review') {
    return NextResponse.json({ error: `A ${app.status} application cannot be approved. Create a new application if this technician needs to reapply.` }, { status: 409 });
  }

  const [existingTechnician] = await db.select({ id: technicians.id, registrationNumber: technicians.registrationNumber })
    .from(technicians)
    .where(or(eq(technicians.email, app.email), eq(technicians.nationalId, app.nationalId), eq(technicians.registrationNumber, app.registrationNumber)))
    .limit(1);
  if (existingTechnician) {
    return NextResponse.json({ error: `A technician record already exists for this applicant (${existingTechnician.registrationNumber}). Use the registry management workflow instead.` }, { status: 409 });
  }

  const [existingUser] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, app.email)).limit(1);
  if (existingUser) {
    return NextResponse.json({ error: `A ${existingUser.role} user account already exists for this email.` }, { status: 409 });
  }

  const today = new Date();
  const expiry = new Date(today);
  expiry.setFullYear(today.getFullYear() + 2);

  const technicianId = randomUUID();
  const membershipId = randomUUID();
  const userId = randomUUID();
  const membershipNumber = await generateMembershipNumber();
  const membershipExpiry = `${today.getFullYear()}-12-31`;

  // Neon HTTP executes a batch as one database transaction: either the account, registry
  // record, application state, and membership all persist, or none of them do.
  await db.batch([
    db.insert(users).values({
      id: userId, name: app.name, email: app.email, passwordHash: app.passwordHash,
      role: 'technician', region: app.region, status: 'active', isDemo: false,
    }),
    db.insert(technicians).values({
      id: technicianId,
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
    }),
    db.update(technicianApplications).set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      approvedTechnicianId: technicianId,
    })
    .where(eq(technicianApplications.id, id)),
    db.insert(memberships).values({
      id: membershipId,
      technicianId,
      applicationId: app.id,
      membershipNumber,
      membershipType: 'standard',
      province: app.province,
      status: 'active',
      startDate: today.toISOString().split('T')[0],
      expiryDate: membershipExpiry,
      approvedBy: session.name,
      approvedAt: today,
    }),
  ]);

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
    entityId: membershipId,
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
      relatedEntityId: membershipId,
      sent: result.sent,
    }))
    .catch(() => {});

  return NextResponse.json({
    id: app.id,
    status: 'approved',
    approvedTechnicianId: technicianId,
    reviewedAt: today.toISOString(),
    reviewedBy: session.name,
    membershipId,
    membershipNumber,
    membershipExpiryDate: membershipExpiry,
  });
}
