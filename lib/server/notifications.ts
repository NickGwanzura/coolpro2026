import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { notifications, technicians, users } from '@/db/schema/index';
import type { NotificationContent } from '@/lib/notification-templates';

/**
 * Adds an in-app notification for a user. Never throws: a notification problem must never break
 * the approval, grade or decision that caused it.
 */
export async function notifyUser(userId: string, content: NotificationContent): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      kind: content.kind,
      title: content.title,
      body: content.body,
      link: content.link ?? null,
    });
  } catch (err) {
    console.error('[notifications] could not save a notification:', err instanceof Error ? err.message : err);
  }
}

/** For events that only know an email address (an approved application, a registry technician). */
export async function notifyUserByEmail(email: string, content: NotificationContent): Promise<void> {
  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (user) await notifyUser(user.id, content);
  } catch (err) {
    console.error('[notifications] could not look up the recipient:', err instanceof Error ? err.message : err);
  }
}

/** A registry technician has their own id, separate from their login; find the login by email. */
export async function notifyRegistryTechnician(technicianId: string, content: NotificationContent): Promise<void> {
  try {
    const [row] = await db.select({ email: technicians.email }).from(technicians).where(eq(technicians.id, technicianId)).limit(1);
    if (row?.email) await notifyUserByEmail(row.email, content);
  } catch (err) {
    console.error('[notifications] could not find the technician:', err instanceof Error ? err.message : err);
  }
}

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export async function listNotifications(userId: string, limit = 30): Promise<{ items: NotificationItem[]; unread: number }> {
  const [rows, unreadRows] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit),
    db.select({ total: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);
  return {
    items: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      link: row.link,
      createdAt: row.createdAt.toISOString(),
      read: row.readAt !== null,
    })),
    unread: Number(unreadRows[0]?.total ?? 0),
  };
}

/** Marks some (or all) of a user's own notifications as read. */
export async function markNotificationsRead(userId: string, ids: string[] | 'all'): Promise<void> {
  const own = eq(notifications.userId, userId);
  const unread = isNull(notifications.readAt);
  if (ids === 'all') {
    await db.update(notifications).set({ readAt: new Date() }).where(and(own, unread));
  } else if (ids.length > 0) {
    await db.update(notifications).set({ readAt: new Date() }).where(and(own, unread, inArray(notifications.id, ids.slice(0, 100))));
  }
}
