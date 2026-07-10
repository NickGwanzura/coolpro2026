import { NextResponse } from 'next/server';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { hashPassword, isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from '@/lib/server/password';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { notifyAdminsOfNewApplication } from '@/lib/server/notify-admins';
import { SITE_URL } from '@/lib/site-url';
import type { TechnicianApplication } from '@/types/index';

const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 15 * 60 * 1000;

function toTechnicianApplication(
  row: typeof technicianApplications.$inferSelect,
): TechnicianApplication {
  return {
    id: row.id,
    name: row.name,
    nationalId: row.nationalId,
    registrationNumber: row.registrationNumber,
    email: row.email,
    contactNumber: row.contactNumber,
    province: row.province,
    district: row.district,
    region: row.region,
    specialization: row.specialization,
    employmentStatus: row.employmentStatus as TechnicianApplication['employmentStatus'],
    employer: row.employer ?? undefined,
    yearsExperience: row.yearsExperience,
    certifications: row.certifications as TechnicianApplication['certifications'],
    refrigerantsHandled: row.refrigerantsHandled as string[],
    status: row.status as TechnicianApplication['status'],
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    approvedTechnicianId: row.approvedTechnicianId ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db
    .select()
    .from(technicianApplications)
    .orderBy(desc(technicianApplications.submittedAt));
  return NextResponse.json(rows.map(toTechnicianApplication));
}

export async function POST(req: Request) {
  if (!checkRateLimit(`technician-application:${getClientIp(req)}`, SIGNUP_RATE_LIMIT, SIGNUP_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many applications from this address. Try again later.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<TechnicianApplication> & { password?: string };

  const required: Array<keyof TechnicianApplication> = [
    'name', 'nationalId', 'registrationNumber', 'email',
    'contactNumber', 'province', 'district', 'specialization',
  ];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  if (!isPasswordStrongEnough(body.password ?? '')) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  const email = String(body.email).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const regNo = String(body.registrationNumber).trim();

  const [duplicate] = await db
    .select({ id: technicianApplications.id, status: technicianApplications.status })
    .from(technicianApplications)
    .where(
      and(
        or(
          eq(technicianApplications.registrationNumber, regNo),
          eq(technicianApplications.email, email),
        ),
        or(
          eq(technicianApplications.status, 'submitted'),
          eq(technicianApplications.status, 'under-review'),
        ),
      ),
    )
    .limit(1);

  if (duplicate) {
    return NextResponse.json(
      { error: 'An application with this email or registration number is already under review.' },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(body.password!);

  const [inserted] = await db
    .insert(technicianApplications)
    .values({
      name: String(body.name).trim(),
      nationalId: String(body.nationalId).trim(),
      registrationNumber: regNo,
      email,
      passwordHash,
      contactNumber: String(body.contactNumber).trim(),
      province: String(body.province).trim(),
      district: String(body.district).trim(),
      region: String(body.region ?? body.province).trim(),
      specialization: String(body.specialization).trim(),
      employmentStatus: (body.employmentStatus ?? 'employed') as 'employed' | 'self-employed' | 'unemployed',
      employer: body.employer ?? null,
      yearsExperience: Number(body.yearsExperience ?? 0),
      certifications: body.certifications ?? [],
      refrigerantsHandled: body.refrigerantsHandled ?? [],
      status: 'submitted',
    })
    .returning();

  // Notify admins that a new applicant is awaiting review — best-effort, never blocks signup
  notifyAdminsOfNewApplication({
    applicantName: inserted.name,
    applicantEmail: inserted.email,
    roleLabel: 'technician',
    reviewPath: `${SITE_URL}/admin/applications`,
  }).catch(() => {});

  return NextResponse.json(toTechnicianApplication(inserted), { status: 201 });
}
