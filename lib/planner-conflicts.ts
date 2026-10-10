import type { PlannerJob } from '@/types/index';

/** Open jobs the same technician already has on that date. */
export function findConflicts(
    jobs: Pick<PlannerJob, 'id' | 'technicianId' | 'scheduledDate' | 'status' | 'clientName'>[],
    technicianId: string | undefined,
    date: string,
    ignoreJobId?: string,
) {
    if (!technicianId || !date) return [];
    return jobs.filter(job =>
        job.id !== ignoreJobId &&
        job.technicianId === technicianId &&
        job.scheduledDate === date &&
        job.status !== 'completed' && job.status !== 'cancelled',
    );
}

/** Calendar-day comparison on ISO dates, so time zones and clock time cannot matter. */
export function isPastDate(date: string, today: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date < today;
}

export function isValidIsoDate(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
