"use client";

import useSWR, { mutate } from 'swr';
import type {
  ManagedCourse,
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
} from '@/types/index';

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

export function useCourses() {
  return useSWR<ManagedCourse[]>('/api/courses', fetcher);
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

// ---------------------------------------------------------------------------
// Exam submissions
// ---------------------------------------------------------------------------

export function useExamSubmissions() {
  return useSWR<ExamSubmission[]>('/api/exam-submissions', fetcher);
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

export function useReorders() {
  return useSWR<SupplierReorder[]>('/api/supplier-reorders', fetcher);
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

export function useTechnicians(q?: string) {
  const url = q ? `/api/technicians?q=${encodeURIComponent(q)}` : '/api/technicians';
  return useSWR<Technician[]>(url, fetcher);
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

export function useSupplierApplications() {
  return useSWR<SupplierApplicationRecord[]>('/api/supplier-applications', fetcher);
}

export async function createSupplierApplication(
  body: Omit<SupplierRegistration, 'id' | 'status' | 'submittedAt'>
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

export function useSupplierComplianceApplications() {
  return useSWR<SupplierComplianceApplication[]>('/api/supplier-compliance-applications', fetcher);
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

export function useSupplierLedger(supplierId?: string) {
  const url = supplierId
    ? `/api/supplier-ledger?supplierId=${encodeURIComponent(supplierId)}`
    : '/api/supplier-ledger';
  return useSWR<SupplierLedgerEntry[]>(url, fetcher);
}

export async function createLedgerEntry(body: Omit<SupplierLedgerEntry, 'id'>): Promise<SupplierLedgerEntry> {
  const result = await post<SupplierLedgerEntry>('/api/supplier-ledger', body);
  await mutate('/api/supplier-ledger');
  return result;
}

// ---------------------------------------------------------------------------
// Student applications (public submit + admin review)
// ---------------------------------------------------------------------------

export type StudentApplicationInput = Omit<StudentApplication, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote'>;

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
  'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote' | 'approvedTechnicianId'
>;

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
  return result;
}

export async function rejectTechnicianApplication(id: string, notes?: string): Promise<TechnicianApplication> {
  const result = await post<TechnicianApplication>(`/api/technician-applications/${id}/reject`, { notes });
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
