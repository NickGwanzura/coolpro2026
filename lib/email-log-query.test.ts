import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, escapeLike, MAX_PAGE_SIZE, parseEmailLogQuery } from './email-log-query';

const parse = (query: string) => parseEmailLogQuery(new URLSearchParams(query));

describe('parseEmailLogQuery', () => {
  it('has sensible defaults', () => {
    expect(parse('')).toEqual({ status: undefined, type: undefined, search: undefined, from: undefined, to: undefined, page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('accepts a status, the "problems" shortcut, a type and a search', () => {
    expect(parse('status=bounced').status).toBe('bounced');
    expect(parse('status=problems').status).toBe('problems');
    expect(parse('type=password_reset').type).toBe('password_reset');
    expect(parse('q=%20ada%20').search).toBe('ada');
  });

  it('ignores values it does not recognise', () => {
    expect(parse('status=exploded').status).toBeUndefined();
    expect(parse("type=x';drop table").type).toBeUndefined();
    expect(parse('type=Has Spaces').type).toBeUndefined();
    expect(parse('q=%20%20').search).toBeUndefined();
  });

  it('reads whole days as inclusive ranges', () => {
    const query = parse('from=2026-10-01&to=2026-10-09');
    expect(query.from?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(query.to?.toISOString()).toBe('2026-10-09T23:59:59.999Z');
  });

  it('rejects impossible or malformed dates', () => {
    expect(parse('from=2026-02-30').from).toBeUndefined();
    expect(parse('to=yesterday').to).toBeUndefined();
    expect(parse('from=2026-1-1').from).toBeUndefined();
  });

  it('keeps paging inside safe limits', () => {
    expect(parse('page=3').page).toBe(3);
    expect(parse('page=0').page).toBe(1);
    expect(parse('page=-4').page).toBe(1);
    expect(parse('page=abc').page).toBe(1);
    expect(parse('pageSize=25').pageSize).toBe(25);
    expect(parse('pageSize=5000').pageSize).toBe(MAX_PAGE_SIZE);
    expect(parse('pageSize=2').pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('caps a very long search', () => {
    expect(parse(`q=${'a'.repeat(300)}`).search).toHaveLength(100);
  });
});

describe('escapeLike', () => {
  it('stops wildcard characters in a search acting as wildcards', () => {
    expect(escapeLike('100%_done\\')).toBe('100\\%\\_done\\\\');
    expect(escapeLike('plain')).toBe('plain');
  });
});
