import type { CourseModule, ManagedCourse } from '@/lib/platformStore';
import { courses } from '@/db/schema/index';

const ALLOWED_MATERIAL_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
];

export function toManagedCourse(row: typeof courses.$inferSelect): ManagedCourse {
  return {
    id: row.id,
    lecturerId: row.lecturerId,
    lecturerName: row.lecturerName,
    title: row.title,
    description: row.description,
    modules: row.modules as ManagedCourse['modules'],
    status: row.status as ManagedCourse['status'],
    rejectionReason: row.rejectionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function isAllowedCourseMaterialType(fileType: string) {
  return ALLOWED_MATERIAL_TYPES.includes(fileType);
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateCourseModules(value: unknown): { modules?: CourseModule[]; error?: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'Add at least one course module before saving.' };
  }

  const modules: CourseModule[] = [];

  for (const [index, raw] of value.entries()) {
    if (!raw || typeof raw !== 'object') {
      return { error: `Module ${index + 1} is invalid.` };
    }

    const item = raw as Record<string, unknown>;
    const title = cleanText(item.title);
    const content = cleanText(item.content);
    const minutes = Number(item.minutes);

    if (!title) return { error: `Module ${index + 1} needs a title.` };
    if (!content) return { error: `Module ${index + 1} needs learning content.` };
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 480) {
      return { error: `Module ${index + 1} minutes must be between 1 and 480.` };
    }

    const attachments = Array.isArray(item.attachments)
      ? item.attachments.filter((attachment): attachment is NonNullable<CourseModule['attachments']>[number] => {
          if (!attachment || typeof attachment !== 'object') return false;
          const candidate = attachment as Record<string, unknown>;
          return Boolean(
            cleanText(candidate.id) &&
            cleanText(candidate.fileName) &&
            cleanText(candidate.fileType) &&
            cleanText(candidate.r2Key) &&
            cleanText(candidate.uploadedAt) &&
            Number.isFinite(Number(candidate.sizeBytes)) &&
            Number(candidate.sizeBytes) > 0,
          );
        })
      : undefined;

    modules.push({
      title,
      content,
      minutes: Math.round(minutes),
      attachments,
    });
  }

  return { modules };
}

export function courseReferencesMaterial(modules: unknown, r2Key: string) {
  if (!Array.isArray(modules)) return false;
  return modules.some((module) => {
    if (!module || typeof module !== 'object') return false;
    const attachments = (module as { attachments?: unknown }).attachments;
    if (!Array.isArray(attachments)) return false;
    return attachments.some((attachment) => (
      Boolean(attachment) &&
      typeof attachment === 'object' &&
      (attachment as { r2Key?: unknown }).r2Key === r2Key
    ));
  });
}

export function validateCourseBasics(body: { title?: unknown; description?: unknown }) {
  const title = cleanText(body.title);
  const description = cleanText(body.description);

  if (!title) return { error: 'Course title is required.' };
  if (!description) return { error: 'Course description is required.' };
  if (title.length > 180) return { error: 'Course title must be 180 characters or fewer.' };
  if (description.length > 3000) return { error: 'Course description must be 3000 characters or fewer.' };

  return { title, description };
}
