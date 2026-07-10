import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { examSubmissions, cocRequests, plannerJobs, gasUsageLogs, rewardRedemptions } from '@/db/schema/index';

// Point values per real, DB-verifiable event. Kept in one place so the earned total shown to a
// technician always matches what a redemption request is validated against server-side.
export const POINTS_PER_EXAM_PASSED = 200;
export const POINTS_PER_COC_APPROVED = 50;
export const POINTS_PER_JOB_COMPLETED = 25;
export const POINTS_PER_RECOVERY_LOG = 30;
export const POINTS_PER_LEAK_REPAIR_LOG = 100;

export interface RewardBreakdownItem {
  label: string;
  count: number;
  pointsEach: number;
  totalPoints: number;
}

export interface TechnicianRewardSummary {
  breakdown: RewardBreakdownItem[];
  totalEarned: number;
  reservedPoints: number;
  availablePoints: number;
}

export async function computeTechnicianRewardSummary(technicianId: string): Promise<TechnicianRewardSummary> {
  const [examRows, cocRows, jobRows, gasRows, redemptionRows] = await Promise.all([
    db.select().from(examSubmissions).where(and(eq(examSubmissions.studentId, technicianId), eq(examSubmissions.passed, true))),
    db.select().from(cocRequests).where(and(eq(cocRequests.technicianId, technicianId), eq(cocRequests.status, 'approved'))),
    db.select().from(plannerJobs).where(and(eq(plannerJobs.technicianId, technicianId), eq(plannerJobs.status, 'completed'))),
    db.select().from(gasUsageLogs).where(eq(gasUsageLogs.technicianId, technicianId)),
    db.select().from(rewardRedemptions).where(
      and(eq(rewardRedemptions.userId, technicianId), inArray(rewardRedemptions.status, ['requested', 'fulfilled']))
    ),
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
  const reservedPoints = redemptionRows.reduce((sum, r) => sum + r.pointsCost, 0);

  return {
    breakdown,
    totalEarned,
    reservedPoints,
    availablePoints: totalEarned - reservedPoints,
  };
}
