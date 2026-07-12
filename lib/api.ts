"use client";

import useSWR, { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';
import type {
  ManagedCourse,
  CourseAttachment,
  ExamSubmission,
  SupplierReorder,
  TechnicianVerification,
  VerificationMethod,
} from '@/lib/platformStore';
import type {
  Technician,
  SupplierRegistration,
  SupplierComplianceApplication,
  SupplierLedgerEntry,
  StudentApplication,
  TechnicianApplication,
  RefrigerantLog,
  GasUsageByJobTypeResponse,
  PlannerJob,
  EquipmentRecord,
  TrainingSession,
  TrainerCertificateRequest,
  ApprovedSupplier,
  Refrigerant,
  RefrigerantListResponse,
  WhatGasSyncLog,
  Cylinder,
  TradePermit,
  ReclamationRecord,
  RecyclingRecord,
	  RefrigerantAnalytics,
	  Invite,
	  AdminUserRecord,
	  OcrScanRecord,
	  CocRequest,
	  Installation,
	  RewardRedemption,
	  OccupationalAccident,
	  Membership,
	  AuditLogEntry,
	  EmailLogEntry,
} from '@/types/index';
import type { TechnicianRewardSummary } from '@/lib/server/rewards';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export function useCourses(enabled = true) {
  return useSWR<ManagedCourse[]>(enabled ? '/api/courses' : null, fetcher);
}

export function useCourse(id: string | undefined) {
  return useSWR<ManagedCourse>(id ? `/api/courses/${id}` : null, fetcher);
}

export async function createCourse(
  body: Omit<ManagedCourse, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ManagedCourse> {
  const result = await post<ManagedCourse>('/api/courses', body);
  await mutate('/api/courses');
  return result;
}

export async function updateCourse(
  id: string,
  body: Partial<Pick<ManagedCourse, 'title' | 'description' | 'modules'>>
): Promise<ManagedCourse> {
  const result = await patch<ManagedCourse>(`/api/courses/${id}`, body);
  await mutate('/api/courses');
  await mutate(`/api/courses/${id}`);
  return result;
}

export async function submitCourse(id: string): Promise<ManagedCourse> {
  const result = await post<ManagedCourse>(`/api/courses/${id}/submit`);
  await mutate('/api/courses');
  await mutate(`/api/courses/${id}`);
  return result;
}

export async function approveCourse(id: string): Promise<ManagedCourse> {
  const result = await post<ManagedCourse>(`/api/courses/${id}/approve`);
  await mutate('/api/courses');
  await mutate(`/api/courses/${id}`);
  return result;
}

export async function rejectCourse(id: string, reason: string): Promise<ManagedCourse> {
  const result = await post<ManagedCourse>(`/api/courses/${id}/reject`, { reason });
  await mutate('/api/courses');
  await mutate(`/api/courses/${id}`);
  return result;
}

export async function uploadCourseMaterial(
  courseId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<CourseAttachment> {
  const { uploadUrl, r2Key } = await post<{ uploadUrl: string; r2Key: string }>(
    `/api/courses/${courseId}/materials/upload-url`,
    { fileName: file.name, fileType: file.type || 'application/octet-stream', sizeBytes: file.size }
  );

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    r2Key,
    uploadedAt: new Date().toISOString(),
  };
}

export async function getCourseMaterialDownloadUrl(courseId: string, r2Key: string): Promise<string> {
  const { downloadUrl } = await post<{ downloadUrl: string }>(`/api/courses/${courseId}/materials/download-url`, { r2Key });
  return downloadUrl;
}

export async function deleteCourseMaterial(courseId: string, r2Key: string): Promise<void> {
  await post(`/api/courses/${courseId}/materials/delete`, { r2Key });
}

// ---------------------------------------------------------------------------
// Exam submissions
// ---------------------------------------------------------------------------

export function useExamSubmissions(enabled = true) {
  return useSWR<ExamSubmission[]>(enabled ? '/api/exam-submissions' : null, fetcher);
}

export async function gradeExamSubmission(
  id: string,
  body: { score: number; passed: boolean; feedback: string }
): Promise<ExamSubmission> {
  const result = await post<ExamSubmission>(`/api/exam-submissions/${id}/grade`, body);
  await mutate('/api/exam-submissions');
  return result;
}

// ---------------------------------------------------------------------------
// Supplier reorders
// ---------------------------------------------------------------------------

export function useReorders(enabled = true) {
  return useSWR<SupplierReorder[]>(enabled ? '/api/supplier-reorders' : null, fetcher);
}

export async function createReorder(
  body: Pick<SupplierReorder, 'gasType' | 'quantityKg' | 'purpose' | 'supplierNotes'>
): Promise<SupplierReorder> {
  const result = await post<SupplierReorder>('/api/supplier-reorders', body);
  await mutate('/api/supplier-reorders');
  return result;
}

export async function hevacrazApproveReorder(id: string): Promise<SupplierReorder> {
  const result = await post<SupplierReorder>(`/api/supplier-reorders/${id}/hevacraz-approve`);
  await mutate('/api/supplier-reorders');
  return result;
}

export async function hevacrazRejectReorder(id: string, reason: string): Promise<SupplierReorder> {
  const result = await post<SupplierReorder>(`/api/supplier-reorders/${id}/hevacraz-reject`, { reason });
  await mutate('/api/supplier-reorders');
  return result;
}

export async function nouApproveReorder(id: string): Promise<SupplierReorder> {
  const result = await post<SupplierReorder>(`/api/supplier-reorders/${id}/nou-approve`);
  await mutate('/api/supplier-reorders');
  return result;
}

export async function nouRejectReorder(id: string, reason: string): Promise<SupplierReorder> {
  const result = await post<SupplierReorder>(`/api/supplier-reorders/${id}/nou-reject`, { reason });
  await mutate('/api/supplier-reorders');
  return result;
}

// ---------------------------------------------------------------------------
// Technician verifications
// ---------------------------------------------------------------------------

export function useVerifications() {
  return useSWR<TechnicianVerification[]>('/api/technician-verifications', fetcher);
}

export interface VerifyTechnicianResult {
  technician: Technician | null;
  result: import('@/lib/platformStore').VerificationResult;
  verification: TechnicianVerification;
}

export async function verifyTechnician(body: {
  method: VerificationMethod;
  query: string;
}): Promise<VerifyTechnicianResult> {
  const result = await post<VerifyTechnicianResult>('/api/technician-verifications', body);
  await mutate('/api/technician-verifications');
  return result;
}

// ---------------------------------------------------------------------------
// Technicians
// ---------------------------------------------------------------------------

export function useTechnicians(q?: string, enabled = true) {
  const url = q ? `/api/technicians?q=${encodeURIComponent(q)}` : '/api/technicians';
  return useSWR<Technician[]>(enabled ? url : null, fetcher);
}

export function useTechnician(id: string | undefined) {
  return useSWR<Technician>(id ? `/api/technicians/${id}` : null, fetcher);
}

export async function updateTechnician(id: string, body: Partial<Technician>): Promise<Technician> {
  const result = await patch<Technician>(`/api/technicians/${id}`, body);
  await mutate('/api/technicians');
  await mutate(`/api/technicians/${id}`);
  return result;
}

export async function uploadTechnicianPhoto(id: string, file: File): Promise<Technician> {
  const { uploadUrl, r2Key } = await post<{ uploadUrl: string; r2Key: string }>(
    `/api/technicians/${id}/photo-upload-url`,
    { fileName: file.name, fileType: file.type || 'application/octet-stream', sizeBytes: file.size }
  );

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  const result = await patch<Technician>(`/api/technicians/${id}`, { photoKey: r2Key });
  await mutate('/api/technicians');
  await mutate(`/api/technicians/${id}`);
  return result;
}

export async function createTechnician(body: Partial<Technician>): Promise<Technician> {
  const result = await post<Technician>('/api/technicians', body);
  await mutate('/api/technicians');
  return result;
}

export async function deleteTechnician(id: string): Promise<void> {
  const res = await fetch(`/api/technicians/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  await mutate('/api/technicians');
  await mutate(`/api/technicians/${id}`);
}

// ---------------------------------------------------------------------------
// Supplier applications
// ---------------------------------------------------------------------------

export type SupplierApplicationRecord = SupplierRegistration & {
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
};

export function useSupplierApplications(enabled = true) {
  return useSWR<SupplierApplicationRecord[]>(enabled ? '/api/supplier-applications' : null, fetcher);
}

export async function createSupplierApplication(
  body: Omit<SupplierRegistration, 'id' | 'status' | 'submittedAt' | 'registrationNumber'> & { password: string }
): Promise<SupplierApplicationRecord> {
  const result = await post<SupplierApplicationRecord>('/api/supplier-applications', body);
  await mutate('/api/supplier-applications');
  return result;
}

export async function approveSupplierApplication(id: string): Promise<SupplierApplicationRecord> {
  const result = await post<SupplierApplicationRecord>(`/api/supplier-applications/${id}/approve`);
  await mutate('/api/supplier-applications');
  return result;
}

export async function rejectSupplierApplication(id: string, notes?: string): Promise<SupplierApplicationRecord> {
  const result = await post<SupplierApplicationRecord>(`/api/supplier-applications/${id}/reject`, { notes });
  await mutate('/api/supplier-applications');
  return result;
}

// ---------------------------------------------------------------------------
// Supplier compliance applications
// ---------------------------------------------------------------------------

export function useSupplierComplianceApplications(enabled = true) {
  return useSWR<SupplierComplianceApplication[]>(enabled ? '/api/supplier-compliance-applications' : null, fetcher);
}

export async function createSupplierComplianceApplication(
  body: Omit<SupplierComplianceApplication, 'id' | 'status' | 'submittedAt' | 'supplierEmail' | 'supplierName'>
): Promise<SupplierComplianceApplication> {
  const result = await post<SupplierComplianceApplication>('/api/supplier-compliance-applications', body);
  await mutate('/api/supplier-compliance-applications');
  return result;
}

export async function approveSupplierComplianceApplication(id: string): Promise<SupplierComplianceApplication> {
  const result = await post<SupplierComplianceApplication>(`/api/supplier-compliance-applications/${id}/approve`);
  await mutate('/api/supplier-compliance-applications');
  return result;
}

export async function rejectSupplierComplianceApplication(id: string, notes?: string): Promise<SupplierComplianceApplication> {
  const result = await post<SupplierComplianceApplication>(`/api/supplier-compliance-applications/${id}/reject`, { notes });
  await mutate('/api/supplier-compliance-applications');
  return result;
}

// ---------------------------------------------------------------------------
// Supplier ledger
// ---------------------------------------------------------------------------

export function useSupplierLedger(supplierId?: string, enabled = true) {
  const url = supplierId
    ? `/api/supplier-ledger?supplierId=${encodeURIComponent(supplierId)}`
    : '/api/supplier-ledger';
  return useSWR<SupplierLedgerEntry[]>(enabled ? url : null, fetcher);
}

export async function createLedgerEntry(body: Omit<SupplierLedgerEntry, 'id'>): Promise<SupplierLedgerEntry> {
  const result = await post<SupplierLedgerEntry>('/api/supplier-ledger', body);
  await mutate('/api/supplier-ledger');
  return result;
}

// ---------------------------------------------------------------------------
// Student applications (public submit + admin review)
// ---------------------------------------------------------------------------

export type StudentApplicationInput = Omit<StudentApplication, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote'> & { password: string };

export function useStudentApplications() {
  return useSWR<StudentApplication[]>('/api/student-applications', fetcher);
}

export async function createStudentApplication(body: StudentApplicationInput): Promise<StudentApplication> {
  const result = await post<StudentApplication>('/api/student-applications', body);
  await mutate('/api/student-applications');
  return result;
}

export async function approveStudentApplication(id: string): Promise<StudentApplication> {
  const result = await post<StudentApplication>(`/api/student-applications/${id}/approve`);
  await mutate('/api/student-applications');
  return result;
}

export async function rejectStudentApplication(id: string, notes?: string): Promise<StudentApplication> {
  const result = await post<StudentApplication>(`/api/student-applications/${id}/reject`, { notes });
  await mutate('/api/student-applications');
  return result;
}

// ---------------------------------------------------------------------------
// Technician applications (public self-registration + admin review)
// ---------------------------------------------------------------------------

export type TechnicianApplicationInput = Omit<
  TechnicianApplication,
  'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote' | 'approvedTechnicianId' | 'registrationNumber'
> & { password: string };

export function useTechnicianApplications() {
  return useSWR<TechnicianApplication[]>('/api/technician-applications', fetcher);
}

export async function createTechnicianApplication(
  body: TechnicianApplicationInput,
): Promise<TechnicianApplication> {
  const result = await post<TechnicianApplication>('/api/technician-applications', body);
  await mutate('/api/technician-applications');
  return result;
}

export async function approveTechnicianApplication(id: string): Promise<TechnicianApplication> {
  const result = await post<TechnicianApplication>(`/api/technician-applications/${id}/approve`);
  await mutate('/api/technician-applications');
  await mutate('/api/technicians');
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/memberships'));
  return result;
}

export async function rejectTechnicianApplication(
  id: string,
  payload?: string | { reason?: string; internalNotes?: string; applicantMessage?: string },
): Promise<TechnicianApplication> {
  const body = typeof payload === 'string' ? { notes: payload } : (payload ?? {});
  const result = await post<TechnicianApplication>(`/api/technician-applications/${id}/reject`, body);
  await mutate('/api/technician-applications');
  return result;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  isDemo: boolean;
  status: string;
}

export function useUsers() {
  return useSWR<AppUser[]>('/api/users', fetcher);
}

// ---------------------------------------------------------------------------
// Gas usage logs (DB-backed)
// ---------------------------------------------------------------------------

/** Fetch aggregated gas usage by job type from the DB */
export function useGasUsage(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const key = `/api/jobs/gas-usage${qs ? `?${qs}` : ''}`;
  return useSWR<GasUsageByJobTypeResponse>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

/** Save gas usage logs to the DB */
export async function createGasLogs(logs: RefrigerantLog[]): Promise<RefrigerantLog[]> {
  const result = await post<RefrigerantLog[]>('/api/gas-logs', { logs });
  await mutate('/api/gas-logs');
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/jobs/gas-usage'));
  return result;
}

/** Fetch raw refrigerant logs from the DB (for admin views) */
export function useGasLogs(from?: string, to?: string, limit?: number) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useSWR<RefrigerantLog[]>(`/api/gas-logs${qs ? `?${qs}` : ''}`, fetcher);
}

// ---------------------------------------------------------------------------
// Job Planner (DB-backed)
// ---------------------------------------------------------------------------

export function usePlannerJobs() {
  return useSWR<PlannerJob[]>('/api/planner-jobs', fetcher);
}

export async function createPlannerJob(
  body: Omit<PlannerJob, 'id' | 'createdAt' | 'updatedAt' | 'technicianId' | 'technicianName'> & {
    technicianId?: string;
    technicianName?: string;
  },
): Promise<PlannerJob> {
  const result = await post<PlannerJob>('/api/planner-jobs', body);
  await mutate('/api/planner-jobs');
  return result;
}

export async function updatePlannerJob(
  id: string,
  body: Partial<Pick<PlannerJob, 'status' | 'notes' | 'checklistItems' | 'preJobChecklistComplete'>>,
): Promise<PlannerJob> {
  const result = await patch<PlannerJob>(`/api/planner-jobs/${id}`, body);
  await mutate('/api/planner-jobs');
  return result;
}

export async function markJobComplete(id: string): Promise<PlannerJob> {
  return updatePlannerJob(id, { status: 'completed' });
}

// ---------------------------------------------------------------------------
// Field Scheduling — equipment register (DB-backed, read-only from the client)
// ---------------------------------------------------------------------------

export function useEquipmentRecords() {
  return useSWR<EquipmentRecord[]>('/api/equipment-records', fetcher);
}

// ---------------------------------------------------------------------------
// Training sessions (DB-backed)
// ---------------------------------------------------------------------------

export function useTrainingSessions(enabled = true) {
  return useSWR<TrainingSession[]>(enabled ? '/api/training-sessions' : null, fetcher);
}

export async function createTrainingSession(
  body: Omit<TrainingSession, 'id' | 'trainerName' | 'trainerEmail' | 'seatsRemaining' | 'status'>,
): Promise<TrainingSession> {
  const result = await post<TrainingSession>('/api/training-sessions', body);
  await mutate('/api/training-sessions');
  return result;
}

// ---------------------------------------------------------------------------
// Trainer certificate requests (DB-backed)
// ---------------------------------------------------------------------------

export function useCertificateRequests(enabled = true) {
  return useSWR<TrainerCertificateRequest[]>(enabled ? '/api/certificate-requests' : null, fetcher);
}

export async function createCertificateRequest(
  body: Omit<
    TrainerCertificateRequest,
    'id' | 'trainerName' | 'trainerEmail' | 'overallScore' | 'status' | 'submittedAt'
  >,
): Promise<TrainerCertificateRequest> {
  const result = await post<TrainerCertificateRequest>('/api/certificate-requests', body);
  await mutate('/api/certificate-requests');
  return result;
}

export async function reviewCertificateRequest(
  id: string,
  action: 'approve' | 'reject' | 'issue',
): Promise<TrainerCertificateRequest> {
  const result = await post<TrainerCertificateRequest>(`/api/certificate-requests/${id}/${action}`);
  await mutate('/api/certificate-requests');
  return result;
}

// ---------------------------------------------------------------------------
// Approved suppliers directory (DB-backed)
// ---------------------------------------------------------------------------

export function useApprovedSuppliers() {
  return useSWR<ApprovedSupplier[]>('/api/suppliers/approved', fetcher);
}

// ---------------------------------------------------------------------------
// UNEP WhatGas refrigerant registry (DB-backed, synced from services.ozonaction.org)
// ---------------------------------------------------------------------------

export type RefrigerantFilterParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  isHFC?: boolean;
  isHCFC?: boolean;
  isCFC?: boolean;
  isSingle?: boolean;
  isODP?: boolean;
  highGwp?: boolean;
  kigali?: boolean;
  montreal?: boolean;
};

function buildRefrigerantQuery(params: RefrigerantFilterParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  for (const key of ['isHFC', 'isHCFC', 'isCFC', 'isSingle', 'isODP', 'highGwp', 'kigali', 'montreal'] as const) {
    if (params[key] !== undefined) qs.set(key, String(params[key]));
  }
  return qs.toString();
}

export function useRefrigerants(params: RefrigerantFilterParams = {}) {
  const qs = buildRefrigerantQuery(params);
  return useSWR<RefrigerantListResponse>(`/api/refrigerants${qs ? `?${qs}` : ''}`, fetcher);
}

// Paged "load more" browsing (e.g. the refrigerant catalogue). Unlike useRefrigerants with a
// growing pageSize, this advances the page number per "load more" click, so it never runs
// into the API's MAX_PAGE_SIZE cap — a fixed page size stays well under it regardless of how
// many pages get loaded. Changing q/filters starts a fresh page series automatically since
// they're part of the SWRInfinite key.
export function useRefrigerantsInfinite(params: Omit<RefrigerantFilterParams, 'page' | 'pageSize'> = {}, pageSize = 24) {
  const getKey = (pageIndex: number, previousPageData: RefrigerantListResponse | null) => {
    if (previousPageData && previousPageData.data.length === 0) return null;
    const qs = buildRefrigerantQuery({ ...params, page: pageIndex + 1, pageSize });
    return `/api/refrigerants?${qs}`;
  };
  return useSWRInfinite<RefrigerantListResponse>(getKey, fetcher);
}

export function useRefrigerant(id: number | null | undefined) {
  return useSWR<Refrigerant>(id != null ? `/api/refrigerants/${id}` : null, fetcher);
}

export async function searchRefrigerantsOnce(
  params: RefrigerantFilterParams,
  basePath = '/api/refrigerants',
): Promise<RefrigerantListResponse> {
  const qs = buildRefrigerantQuery(params);
  return fetcher<RefrigerantListResponse>(`${basePath}${qs ? `?${qs}` : ''}`);
}

export function useWhatGasSyncStatus() {
  return useSWR<{ logs: WhatGasSyncLog[]; lastSuccessfulSync: WhatGasSyncLog | null; totalRefrigerants: number }>(
    '/api/admin/sync/whatgas',
    fetcher,
  );
}

export async function triggerWhatGasSync() {
  const result = await post<{ status: string }>('/api/admin/sync/whatgas');
  await mutate('/api/admin/sync/whatgas');
  return result;
}

// ---------------------------------------------------------------------------
// Cylinder Registry (DB-backed)
// ---------------------------------------------------------------------------

export function useCylinders() {
  return useSWR<Cylinder[]>('/api/cylinders', fetcher);
}

export async function createCylinder(
  body: Omit<Cylinder, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt'>,
): Promise<Cylinder> {
  const result = await post<Cylinder>('/api/cylinders', body);
  await mutate('/api/cylinders');
  return result;
}

export async function updateCylinder(
  id: string,
  body: Partial<Pick<Cylinder, 'status' | 'currentFillKg' | 'lastFilledDate' | 'lastInspectionDate' | 'nextInspectionDue' | 'notes'>>,
) {
  const result = await patch<Pick<Cylinder, 'id' | 'status' | 'currentFillKg' | 'updatedAt'>>(`/api/cylinders/${id}`, body);
  await mutate('/api/cylinders');
  return result;
}

// ---------------------------------------------------------------------------
// Import/Export Trade Permits (DB-backed)
// ---------------------------------------------------------------------------

export function useTradePermits() {
  return useSWR<TradePermit[]>('/api/permits', fetcher);
}

export async function createTradePermit(
  body: Omit<TradePermit, 'id' | 'permitNumber' | 'applicantName' | 'applicantEmail' | 'status' | 'submittedAt' | 'createdAt'>,
): Promise<TradePermit> {
  const result = await post<TradePermit>('/api/permits', body);
  await mutate('/api/permits');
  return result;
}

export async function reviewTradePermit(id: string, action: 'approve' | 'reject', notes?: string): Promise<TradePermit> {
  const result = await post<TradePermit>(`/api/permits/${id}/${action}`, notes ? { notes } : undefined);
  await mutate('/api/permits');
  return result;
}

// ---------------------------------------------------------------------------
// Reclamation (DB-backed)
// ---------------------------------------------------------------------------

export function useReclamationRecords() {
  return useSWR<ReclamationRecord[]>('/api/reclamation', fetcher);
}

export async function createReclamationRecord(
  body: Omit<ReclamationRecord, 'id' | 'batchNumber' | 'technicianId' | 'technicianName' | 'createdAt'>,
): Promise<ReclamationRecord> {
  const result = await post<ReclamationRecord>('/api/reclamation', body);
  await mutate('/api/reclamation');
  return result;
}

export async function reviewReclamationRecord(
  id: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<ReclamationRecord> {
  const result = await patch<ReclamationRecord>(`/api/reclamation/${id}`, {
    status: action === 'approve' ? 'passed' : 'failed',
    notes,
  });
  await mutate('/api/reclamation');
  return result;
}

// ---------------------------------------------------------------------------
// Recycling (DB-backed)
// ---------------------------------------------------------------------------

export function useRecyclingRecords() {
  return useSWR<RecyclingRecord[]>('/api/recycling', fetcher);
}

export async function createRecyclingRecord(
  body: Omit<RecyclingRecord, 'id' | 'technicianId' | 'technicianName' | 'createdAt'>,
): Promise<RecyclingRecord> {
  const result = await post<RecyclingRecord>('/api/recycling', body);
  await mutate('/api/recycling');
  return result;
}

export async function reviewRecyclingRecord(
  id: string,
  action: 'verify' | 'reject',
  notes?: string,
): Promise<RecyclingRecord> {
  const result = await patch<RecyclingRecord>(`/api/recycling/${id}`, {
    status: action === 'verify' ? 'verified' : 'rejected',
    notes,
  });
  await mutate('/api/recycling');
  return result;
}

// ---------------------------------------------------------------------------
// Refrigerant analytics (DB-backed)
// ---------------------------------------------------------------------------

export function useRefrigerantAnalytics() {
  return useSWR<RefrigerantAnalytics>('/api/admin/refrigerant-analytics', fetcher);
}

// ---------------------------------------------------------------------------
// Invites (DB-backed)
// ---------------------------------------------------------------------------

export function useInvites() {
  return useSWR<{ data: Invite[] }>('/api/admin/invites', fetcher);
}

export async function createInvite(body: {
  email: string;
  role: string;
  region: string;
}): Promise<{ invite: Invite; inviteUrl: string; emailSent: boolean }> {
  const result = await post<{ invite: Invite; inviteUrl: string; emailSent: boolean }>('/api/admin/invites', body);
  await mutate('/api/admin/invites');
  return result;
}

export async function revokeInvite(id: string): Promise<Invite> {
  const result = await post<Invite>(`/api/admin/invites/${id}/revoke`);
  await mutate('/api/admin/invites');
  return result;
}

// ---------------------------------------------------------------------------
// System users (DB-backed, org_admin only)
// ---------------------------------------------------------------------------

export function useAdminUsers(q?: string) {
  const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : '/api/admin/users';
  return useSWR<{ data: AdminUserRecord[] }>(url, fetcher);
}

export async function updateAdminUser(
  id: string,
  body: Partial<Pick<AdminUserRecord, 'role' | 'status' | 'region' | 'name'>>,
): Promise<AdminUserRecord> {
  const result = await patch<AdminUserRecord>(`/api/admin/users/${id}`, body);
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/admin/users'));
  return result;
}

// ---------------------------------------------------------------------------
// OCR nameplate scan history (DB-backed)
// ---------------------------------------------------------------------------

export function useOcrScans() {
  return useSWR<{ data: OcrScanRecord[] }>('/api/ocr-scans', fetcher);
}

export async function createOcrScan(body: {
  rawText: string;
  refrigerantCode?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  matchConfidence?: number;
  whatGasRefrigerantId?: number;
}): Promise<OcrScanRecord> {
  const result = await post<OcrScanRecord>('/api/ocr-scans', body);
  await mutate('/api/ocr-scans');
  return result;
}

// ---------------------------------------------------------------------------
// Certificate of Conformity requests (DB-backed)
// ---------------------------------------------------------------------------

export function useCocRequests() {
  return useSWR<CocRequest[]>('/api/coc-requests', fetcher);
}

export async function createCocRequest(
  body: Pick<CocRequest, 'clientName' | 'location' | 'equipmentType' | 'installationDate' | 'complianceCheck'> &
    Partial<Pick<CocRequest, 'plannerJobId' | 'serialNumber' | 'details'>>,
): Promise<CocRequest> {
  const result = await post<CocRequest>('/api/coc-requests', body);
  await mutate('/api/coc-requests');
  return result;
}

export async function reviewCocRequest(id: string, action: 'approve' | 'reject', notes?: string): Promise<CocRequest> {
  const result = await post<CocRequest>(`/api/coc-requests/${id}/${action}`, notes ? { notes } : undefined);
  await mutate('/api/coc-requests');
  return result;
}

// ---------------------------------------------------------------------------
// Installations (DB-backed)
// ---------------------------------------------------------------------------

export function useInstallations() {
  return useSWR<Installation[]>('/api/installations', fetcher);
}

export async function createInstallation(
  body: Omit<Installation, 'id' | 'technicianId' | 'technicianName' | 'installationDate' | 'status' | 'cocRequested' | 'cocApproved'>,
): Promise<Installation> {
  const result = await post<Installation>('/api/installations', body);
  await mutate('/api/installations');
  return result;
}

export async function updateInstallation(
  id: string,
  body: Partial<Pick<Installation, 'status' | 'cocRequested' | 'cocApproved' | 'cocApprovalDate'>>,
): Promise<Installation> {
  const result = await patch<Installation>(`/api/installations/${id}`, body);
  await mutate('/api/installations');
  return result;
}

// ---------------------------------------------------------------------------
// Rewards (DB-backed points summary + redemptions)
// ---------------------------------------------------------------------------

export function useRewardSummary(technicianId?: string, enabled = true) {
  const url = technicianId ? `/api/rewards/summary?technicianId=${encodeURIComponent(technicianId)}` : '/api/rewards/summary';
  return useSWR<TechnicianRewardSummary>(enabled ? url : null, fetcher);
}

export function useRewardRedemptions(enabled = true) {
  return useSWR<RewardRedemption[]>(enabled ? '/api/rewards/redemptions' : null, fetcher);
}

export async function createRewardRedemption(rewardId: string): Promise<RewardRedemption> {
  const result = await post<RewardRedemption>('/api/rewards/redemptions', { rewardId });
  await mutate('/api/rewards/redemptions');
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/rewards/summary'));
  return result;
}

export async function reviewRewardRedemption(id: string, action: 'approve' | 'reject', notes?: string): Promise<RewardRedemption> {
  const result = await post<RewardRedemption>(`/api/rewards/redemptions/${id}/${action}`, notes ? { notes } : undefined);
  await mutate('/api/rewards/redemptions');
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/rewards/summary'));
  return result;
}

// ---------------------------------------------------------------------------
// Occupational Accidents (DB-backed)
// ---------------------------------------------------------------------------

export function useOccupationalAccidents() {
  return useSWR<OccupationalAccident[]>('/api/occupational-accidents', fetcher);
}

export async function createOccupationalAccident(
  body: Pick<OccupationalAccident, 'date' | 'jobSite' | 'clientName' | 'severity' | 'description'> &
    Partial<Pick<OccupationalAccident, 'refrigerantInvolved' | 'nearMissFlag' | 'nouNotified'>>,
): Promise<OccupationalAccident> {
  const result = await post<OccupationalAccident>('/api/occupational-accidents', body);
  await mutate('/api/occupational-accidents');
  return result;
}

export async function submitAccidentInvestigation(
  id: string,
  body: Pick<OccupationalAccident, 'rootCause' | 'investigationDate' | 'investigatorName' | 'correctiveActions' | 'preventiveMeasures' | 'status'>,
): Promise<OccupationalAccident> {
  const result = await post<OccupationalAccident>(`/api/occupational-accidents/${id}/investigate`, body);
  await mutate('/api/occupational-accidents');
  return result;
}

// ---------------------------------------------------------------------------
// Memberships (DB-backed)
// ---------------------------------------------------------------------------

export function useMemberships(params: { province?: string; status?: string; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.province) qs.set('province', params.province);
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  const query = qs.toString();
  return useSWR<Membership[]>(`/api/memberships${query ? `?${query}` : ''}`, fetcher);
}

export async function createMembership(body: { technicianId: string; membershipType?: string }): Promise<Membership> {
  const result = await post<Membership>('/api/memberships', body);
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/memberships'));
  return result;
}

export async function updateMembership(id: string, body: { status?: Membership['status']; renew?: boolean }): Promise<Membership> {
  const result = await patch<Membership>(`/api/memberships/${id}`, body);
  await mutate((key) => typeof key === 'string' && key.startsWith('/api/memberships'));
  return result;
}

// ---------------------------------------------------------------------------
// Audit log / email log (DB-backed, read-only from the client)
// ---------------------------------------------------------------------------

export function useAuditLog(params: { entityType?: string; entityId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.entityType) qs.set('entityType', params.entityType);
  if (params.entityId) qs.set('entityId', params.entityId);
  const query = qs.toString();
  return useSWR<AuditLogEntry[]>(query ? `/api/audit-log?${query}` : null, fetcher);
}

export function useEmailLog() {
  return useSWR<EmailLogEntry[]>('/api/email-log', fetcher);
}
