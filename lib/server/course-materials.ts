import type { CourseModule } from '@/lib/platformStore';
import { getMaterialSize } from '@/lib/server/r2';

/**
 * Checks that every attachment saved on a course really exists in storage with the size it
 * claims. Returns the file names that are missing or the wrong size. Courses with no
 * attachments never touch storage.
 */
export async function findBrokenAttachments(modules: CourseModule[]): Promise<string[]> {
  const attachments = modules.flatMap((module) => module.attachments ?? []);
  const broken: string[] = [];
  for (const attachment of attachments) {
    const size = await getMaterialSize(attachment.r2Key);
    if (size === null || size !== attachment.sizeBytes) broken.push(attachment.fileName);
  }
  return broken;
}
