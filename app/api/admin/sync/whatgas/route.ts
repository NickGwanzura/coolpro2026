import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { runWhatGasSync } from '@/lib/whatgas/sync';
import { listSyncLogs, getLastSuccessfulSync, countRefrigerants } from '@/lib/whatgas/repository';

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  console.log(`[audit] WhatGas manual sync triggered by ${session.email}`);
  const result = await runWhatGasSync('manual', session.email);

  return NextResponse.json(result, { status: result.status === 'failed' ? 502 : 200 });
}

export async function GET(req: Request) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const [logs, lastSuccess, total] = await Promise.all([
    listSyncLogs(20),
    getLastSuccessfulSync(),
    countRefrigerants(),
  ]);

  return NextResponse.json({
    logs,
    lastSuccessfulSync: lastSuccess,
    totalRefrigerants: total,
  });
}
