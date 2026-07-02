import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { searchRefrigerants, type RefrigerantFilters } from '@/lib/whatgas/service';

const ALL_ROLES = ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'];
const MAX_PAGE_SIZE = 100;

function parseBool(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function GET(req: Request) {
  try {
    requireRole(req, ALL_ROLES);
  } catch (e) {
    return e as Response;
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));

  const filters: RefrigerantFilters = {
    q: url.searchParams.get('q') ?? undefined,
    isHFC: parseBool(url.searchParams.get('isHFC')),
    isHCFC: parseBool(url.searchParams.get('isHCFC')),
    isCFC: parseBool(url.searchParams.get('isCFC')),
    isSingle: parseBool(url.searchParams.get('isSingle')),
    isODP: parseBool(url.searchParams.get('isODP')),
    highGwp: parseBool(url.searchParams.get('highGwp')),
    hasKigaliValue: parseBool(url.searchParams.get('kigali')),
    isCtrlMontrealProtocol: parseBool(url.searchParams.get('montreal')),
  };

  const { rows, total } = await searchRefrigerants(filters, page, pageSize);

  return NextResponse.json({
    data: rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
