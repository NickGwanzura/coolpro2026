import type { registrationApplications } from '@/db/schema/index';
import type { RegistrationApplication } from '@/types/index';

export function toRegistrationApplication(
  row: typeof registrationApplications.$inferSelect,
  emailUnconfirmed = false,
): RegistrationApplication {
  return {
    id: row.id,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    region: row.region,
    organisation: row.organisation ?? undefined,
    experienceSummary: row.experienceSummary,
    details: (row.details as Record<string, unknown> | null) ?? undefined,
    idDocumentName: row.idDocumentName ?? undefined,
    status: row.status,
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    emailUnconfirmed,
  };
}
