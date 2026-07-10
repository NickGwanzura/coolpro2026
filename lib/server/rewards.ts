import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { examSubmissions, cocRequests, plannerJobs, gasUsageLogs, supplierLedger, supplierComplianceApplications, rewardRedemptions } from '@/db/schema/index';

// Point values per real, DB-verifiable event. Kept in one place so the earned total shown to a
// technician always matches what a redemption request is validated against server-side.
export const POINTS_PER_EXAM_PASSED = 200;
export const POINTS_PER_COC_APPROVED = 50;
export const POINTS_PER_JOB_COMPLETED = 25;
export const POINTS_PER_RECOVERY_LOG = 30;
export const POINTS_PER_LEAK_REPAIR_LOG = 100;

// Vendor point values — mirrors the compliance-behaviour incentives already described in
// VendorRewardsPanel's copy (filing sales to the NOU, sharing compliant delivery records,
// completing supplier compliance applications).
export const POINTS_PER_COMPLIANT_SALE = 35;
export const POINTS_PER_APPROVED_CERTIFICATE = 180;
export const POINTS_PER_SUBMITTED_CERTIFICATE = 60;

async function reservedPointsFor(userId: string): Promise<number> {
  const rows = await db
    .select()
    .from(rewardRedemptions)
    .where(and(eq(rewardRedemptions.userId, userId), inArray(rewardRedemptions.status, ['requested', 'fulfilled'])));
  return rows.reduce((sum, r) => sum + r.pointsCost, 0);
}

export interface RewardBreakdownItem {
  label: string;
  count: number;
  pointsEach: number;
  totalPoints: number;
}

export interface RewardSummary {
  breakdown: RewardBreakdownItem[];
  totalEarned: number;
  reservedPoints: number;
  availablePoints: number;
}

// Kept as an alias — this shape is shared by both the technician and vendor summaries.
export type TechnicianRewardSummary = RewardSummary;

export async function computeTechnicianRewardSummary(technicianId: string): Promise<RewardSummary> {
  const [examRows, cocRows, jobRows, gasRows, reservedPoints] = await Promise.all([
    db.select().from(examSubmissions).where(and(eq(examSubmissions.studentId, technicianId), eq(examSubmissions.passed, true))),
    db.select().from(cocRequests).where(and(eq(cocRequests.technicianId, technicianId), eq(cocRequests.status, 'approved'))),
    db.select().from(plannerJobs).where(and(eq(plannerJobs.technicianId, technicianId), eq(plannerJobs.status, 'completed'))),
    db.select().from(gasUsageLogs).where(eq(gasUsageLogs.technicianId, technicianId)),
    reservedPointsFor(technicianId),
  ]);

  const recoveryCount = gasRows.filter(r => r.actionType === 'Recovery').length;
  const leakRepairCount = gasRows.filter(r => r.actionType === 'Leak Repair').length;

  const breakdown: RewardBreakdownItem[] = [
    { label: 'Certification exams passed', count: examRows.length, pointsEach: POINTS_PER_EXAM_PASSED, totalPoints: examRows.length * POINTS_PER_EXAM_PASSED },
    { label: 'Certificates of Conformity approved', count: cocRows.length, pointsEach: POINTS_PER_COC_APPROVED, totalPoints: cocRows.length * POINTS_PER_COC_APPROVED },
    { label: 'Jobs completed', count: jobRows.length, pointsEach: POINTS_PER_JOB_COMPLETED, totalPoints: jobRows.length * POINTS_PER_JOB_COMPLETED },
    { label: 'Refrigerant recoveries logged', count: recoveryCount, pointsEach: POINTS_PER_RECOVERY_LOG, totalPoints: recoveryCount * POINTS_PER_RECOVERY_LOG },
    { label: 'Leak repairs logged', count: leakRepairCount, pointsEach: POINTS_PER_LEAK_REPAIR_LOG, totalPoints: leakRepairCount * POINTS_PER_LEAK_REPAIR_LOG },
  ];

  const totalEarned = breakdown.reduce((sum, item) => sum + item.totalPoints, 0);

  return {
    breakdown,
    totalEarned,
    reservedPoints,
    availablePoints: totalEarned - reservedPoints,
  };
}

export async function computeVendorRewardSummary(vendorId: string, vendorEmail: string): Promise<RewardSummary> {
  const [ledgerRows, complianceRows, reservedPoints] = await Promise.all([
    db.select().from(supplierLedger).where(and(eq(supplierLedger.supplierEmail, vendorEmail), eq(supplierLedger.direction, 'sale'))),
    db.select().from(supplierComplianceApplications).where(eq(supplierComplianceApplications.supplierEmail, vendorEmail)),
    reservedPointsFor(vendorId),
  ]);

  const compliantSaleCount = ledgerRows.filter(r => r.reportedToNou && r.clientReported).length;
  const approvedCertificateCount = complianceRows.filter(r => r.status === 'approved').length;
  const submittedCertificateCount = complianceRows.filter(r => r.status === 'submitted' || r.status === 'under-review').length;

  const breakdown: RewardBreakdownItem[] = [
    { label: 'Compliant sales (filed to NOU & client)', count: compliantSaleCount, pointsEach: POINTS_PER_COMPLIANT_SALE, totalPoints: compliantSaleCount * POINTS_PER_COMPLIANT_SALE },
    { label: 'Approved compliance certificates', count: approvedCertificateCount, pointsEach: POINTS_PER_APPROVED_CERTIFICATE, totalPoints: approvedCertificateCount * POINTS_PER_APPROVED_CERTIFICATE },
    { label: 'Certificates submitted for review', count: submittedCertificateCount, pointsEach: POINTS_PER_SUBMITTED_CERTIFICATE, totalPoints: submittedCertificateCount * POINTS_PER_SUBMITTED_CERTIFICATE },
  ];

  const totalEarned = breakdown.reduce((sum, item) => sum + item.totalPoints, 0);

  return {
    breakdown,
    totalEarned,
    reservedPoints,
    availablePoints: totalEarned - reservedPoints,
  };
}
