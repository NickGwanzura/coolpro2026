// Rules for the proof documents an applicant uploads. Client-safe and pure, so the upload form,
// the server and the tests all use the same limits.

import type { ApplicantRole } from '@/lib/application-roles';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_DOCUMENTS_PER_APPLICATION = 4;
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/** What each role is asked to upload, in plain words. */
export const PROOF_HINTS: Record<ApplicantRole, string> = {
  student: 'Your student ID card or a letter confirming your enrolment.',
  technician: 'A copy of your national ID, plus any trade or training certificates.',
  trainer: 'Your qualification and assessor accreditation certificates.',
  lecturer: 'Proof of employment at your institution, and your qualifications.',
  contractor: 'Your company registration, and any safety certificates you hold.',
  supplier: 'Your company registration, tax clearance and any licences.',
};

/** Returns a message when the file is not acceptable, or null when it is. */
export function checkDocumentFile(file: { name: string; type: string; size: number }): string | null {
  if (!file.name.trim()) return 'The file has no name.';
  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) return 'Upload a PDF, JPG or PNG file.';
  if (file.size <= 0) return 'That file is empty.';
  if (file.size > MAX_DOCUMENT_BYTES) return `Each file must be ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB or smaller.`;
  return null;
}

/** A name that is safe to store and show: no path parts, no control characters, capped length. */
export function safeDocumentName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, '').replace(/\s+/g, ' ').trim();
  const trimmed = cleaned.length > 120 ? `${cleaned.slice(0, 100)}${cleaned.slice(cleaned.lastIndexOf('.') >= 0 ? cleaned.lastIndexOf('.') : cleaned.length).slice(0, 15)}` : cleaned;
  return trimmed || 'document';
}

export function documentSlotsLeft(existingCount: number): number {
  return Math.max(0, MAX_DOCUMENTS_PER_APPLICATION - existingCount);
}
