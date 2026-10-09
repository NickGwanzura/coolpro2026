import type { CourseModule } from '@/lib/platformStore';
import { matchesDeclaredType, SIGNATURE_BYTES_NEEDED } from '@/lib/server/file-signatures';
import { getMaterialSize, readMaterialHead } from '@/lib/server/r2';

export interface AttachmentProblems {
  /** Never finished uploading, or stored with a different size than declared. */
  missing: string[];
  /** Stored, but the file contents do not match the declared type. */
  mismatched: string[];
}

/**
 * Checks every attachment saved on a course: it exists in storage, has the declared size, and its
 * leading bytes match the declared type. Courses with no attachments never touch storage.
 */
export async function findAttachmentProblems(modules: CourseModule[]): Promise<AttachmentProblems> {
  const problems: AttachmentProblems = { missing: [], mismatched: [] };
  for (const attachment of modules.flatMap((module) => module.attachments ?? [])) {
    const size = await getMaterialSize(attachment.r2Key);
    if (size === null || size !== attachment.sizeBytes) {
      problems.missing.push(attachment.fileName);
      continue;
    }
    const head = await readMaterialHead(attachment.r2Key, Math.min(SIGNATURE_BYTES_NEEDED, size));
    if (!matchesDeclaredType(head, attachment.fileType)) problems.mismatched.push(attachment.fileName);
  }
  return problems;
}

export function describeAttachmentProblems(problems: AttachmentProblems): string | null {
  const parts: string[] = [];
  if (problems.missing.length > 0) {
    parts.push(`These files did not finish uploading or were changed: ${problems.missing.join(', ')}.`);
  }
  if (problems.mismatched.length > 0) {
    parts.push(`These files do not match their file type: ${problems.mismatched.join(', ')}.`);
  }
  return parts.length > 0 ? `${parts.join(' ')} Remove and upload them again.` : null;
}
