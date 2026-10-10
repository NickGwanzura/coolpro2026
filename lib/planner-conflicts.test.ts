import { describe, expect, it } from 'vitest';
import { findConflicts, isPastDate, isValidIsoDate } from './planner-conflicts';

const job = (id: string, technicianId: string, scheduledDate: string, status: 'scheduled' | 'completed' = 'scheduled') =>
    ({ id, technicianId, scheduledDate, status, clientName: `Client ${id}` });

describe('findConflicts', () => {
    const jobs = [job('1', 't1', '2026-10-12'), job('2', 't1', '2026-10-12', 'completed'), job('3', 't2', '2026-10-12'), job('4', 't1', '2026-10-13')];
    it('finds only open jobs for the same technician and date', () => {
        expect(findConflicts(jobs, 't1', '2026-10-12').map(j => j.id)).toEqual(['1']);
    });
    it('ignores the job being edited', () => {
        expect(findConflicts(jobs, 't1', '2026-10-12', '1')).toEqual([]);
    });
    it('returns nothing without a technician or date', () => {
        expect(findConflicts(jobs, undefined, '2026-10-12')).toEqual([]);
        expect(findConflicts(jobs, 't1', '')).toEqual([]);
    });
});

describe('dates', () => {
    it('detects past dates by calendar day', () => {
        expect(isPastDate('2026-10-09', '2026-10-10')).toBe(true);
        expect(isPastDate('2026-10-10', '2026-10-10')).toBe(false);
        expect(isPastDate('garbage', '2026-10-10')).toBe(false);
    });
    it('validates ISO dates', () => {
        expect(isValidIsoDate('2026-10-10')).toBe(true);
        expect(isValidIsoDate('2026-02-30')).toBe(false);
        expect(isValidIsoDate('10/10/2026')).toBe(false);
        expect(isValidIsoDate(undefined)).toBe(false);
    });
});
