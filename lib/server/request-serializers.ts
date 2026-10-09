import { cocRequests, tradePermits, trainerCertificateRequests } from '@/db/schema/index';
import type { CocRequest, TradePermit, TrainerCertificateRequest } from '@/types/index';

export function toTrainerCertificateRequest(
  row: typeof trainerCertificateRequests.$inferSelect,
): TrainerCertificateRequest {
  return {
    id: row.id,
    examSubmissionId: row.examSubmissionId ?? undefined,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    technicianRegistrationNumber: row.technicianRegistrationNumber,
    technicianCompany: row.technicianCompany,
    trainerName: row.trainerName,
    trainerEmail: row.trainerEmail,
    courseTitle: row.courseTitle,
    examDate: row.examDate,
    theoryScore: row.theoryScore,
    practicalScore: row.practicalScore,
    overallScore: row.overallScore,
    notes: row.notes ?? undefined,
    status: row.status as TrainerCertificateRequest['status'],
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    adminReviewer: row.adminReviewer ?? undefined,
    certificateNumber: row.certificateNumber ?? undefined,
    issuedAt: row.issuedAt?.toISOString() ?? undefined,
    verificationToken: row.verificationToken ?? undefined,
    verificationUrl:
      row.certificateNumber && row.verificationToken
        ? `/verify-technician?mode=certificate&q=${encodeURIComponent(row.certificateNumber)}&token=${row.verificationToken}`
        : undefined,
    cpdCredits: row.cpdCredits ?? undefined,
  };
}

export function toCocRequest(row: typeof cocRequests.$inferSelect): CocRequest {
  return {
    id: row.id,
    certificateNumber: row.certificateNumber,
    plannerJobId: row.plannerJobId ?? undefined,
    installationId: row.installationId ?? undefined,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location,
    equipmentType: row.equipmentType,
    serialNumber: row.serialNumber ?? undefined,
    installationDate: row.installationDate,
    details: row.details ?? undefined,
    checklistSnapshot: row.checklistSnapshot ?? null,
    evidenceImages: row.evidenceImages ?? [],
    complianceCheck: row.complianceCheck,
    status: row.status as CocRequest['status'],
    verificationToken: row.verificationToken ?? undefined,
    verificationUrl:
      row.verificationToken && row.status === 'approved'
        ? `/verify-coc?q=${encodeURIComponent(row.certificateNumber)}&token=${row.verificationToken}`
        : undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    issuedDate: row.issuedDate ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
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
