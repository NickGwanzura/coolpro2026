import { isEmailStatus, type EmailStatus } from '@/lib/email-status';

// Reads the Email Activity page's filters from a URL, defensively: anything unrecognised is ignored
// rather than trusted. Pure, so the rules can be tested.

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface EmailLogQuery {
  /** A single status, or "problems" for failed, bounced and complained together. */
  status?: EmailStatus | 'problems';
  type?: string;
  search?: string;
  /** Inclusive start of the first day. */
  from?: Date;
  /** Inclusive end of the last day. */
  to?: Date;
  page: number;
  pageSize: number;
}

const TYPE_PATTERN = /^[a-z0-9_]{1,60}$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string | null, endOfDay: boolean): Date | undefined {
  if (!value || !DAY_PATTERN.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
}

export function parseEmailLogQuery(params: URLSearchParams): EmailLogQuery {
  const status = params.get('status');
  const type = params.get('type')?.trim() ?? '';
  const search = params.get('q')?.trim().slice(0, 100) ?? '';
  const page = Math.floor(Number(params.get('page')));
  const requestedSize = Math.floor(Number(params.get('pageSize')));

  return {
    status: status === 'problems' ? 'problems' : isEmailStatus(status) ? status : undefined,
    type: TYPE_PATTERN.test(type) ? type : undefined,
    search: search || undefined,
    from: parseDay(params.get('from'), false),
    to: parseDay(params.get('to'), true),
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
    pageSize: Number.isFinite(requestedSize) && requestedSize >= 10 ? Math.min(requestedSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
  };
}

/** Escapes the characters that have a special meaning inside a SQL LIKE pattern. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
