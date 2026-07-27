import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { ocrScans } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { getWhatGasProfileById } from '@/lib/whatgas/service';
import type { OcrScanRecord } from '@/types/index';

const HISTORY_LIMIT = 20;
const MAX_RAW_TEXT_LENGTH = 12_000;

async function toOcrScanRecord(row: typeof ocrScans.$inferSelect): Promise<OcrScanRecord> {
  const whatGasMatch = row.whatGasRefrigerantId != null
    ? await getWhatGasProfileById(row.whatGasRefrigerantId)
    : null;

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    rawText: row.rawText,
    refrigerantCode: row.refrigerantCode ?? undefined,
    manufacturer: row.manufacturer ?? undefined,
    model: row.model ?? undefined,
    serialNumber: row.serialNumber ?? undefined,
    matchConfidence: row.matchConfidence != null ? Number(row.matchConfidence) : undefined,
    whatGasMatch,
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows =
    session.role === 'org_admin'
      ? await db.select().from(ocrScans).orderBy(desc(ocrScans.createdAt)).limit(HISTORY_LIMIT)
      : await db
          .select()
          .from(ocrScans)
          .where(eq(ocrScans.technicianId, session.id))
          .orderBy(desc(ocrScans.createdAt))
          .limit(HISTORY_LIMIT);

  const data = await Promise.all(rows.map(toOcrScanRecord));
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as {
    rawText?: string;
    refrigerantCode?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    matchConfidence?: number;
    whatGasRefrigerantId?: number;
  };

  if (!body.rawText) {
    return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
  }
  if (body.rawText.length > MAX_RAW_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Scan text is too large.' }, { status: 400 });
  }
  if (body.matchConfidence != null && (!Number.isFinite(body.matchConfidence) || body.matchConfidence < 0 || body.matchConfidence > 1)) {
    return NextResponse.json({ error: 'matchConfidence must be between 0 and 1.' }, { status: 400 });
  }
  if (body.whatGasRefrigerantId != null) {
    const profile = await getWhatGasProfileById(body.whatGasRefrigerantId);
    const normalizedScan = body.refrigerantCode?.toUpperCase().replace(/[\s-]/g, '');
    const normalizedMatch = profile?.code.toUpperCase().replace(/[\s-]/g, '');
    if (!profile || !normalizedScan || normalizedScan !== normalizedMatch) {
      return NextResponse.json({ error: 'The selected WhatGas record does not match the confirmed refrigerant code.' }, { status: 400 });
    }
  }

  const [inserted] = await db
    .insert(ocrScans)
    .values({
      technicianId: session.id,
      technicianName: session.name,
      rawText: body.rawText,
      refrigerantCode: body.refrigerantCode ?? null,
      manufacturer: body.manufacturer ?? null,
      model: body.model ?? null,
      serialNumber: body.serialNumber ?? null,
      matchConfidence: body.matchConfidence != null ? body.matchConfidence.toString() : null,
      whatGasRefrigerantId: body.whatGasRefrigerantId ?? null,
    })
    .returning();

  return NextResponse.json(await toOcrScanRecord(inserted), { status: 201 });
}
