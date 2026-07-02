import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { equipmentRecords } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { EquipmentRecord } from '@/types/index';

function toEquipmentRecord(row: typeof equipmentRecords.$inferSelect): EquipmentRecord {
  return {
    id: row.id,
    clientId: row.clientId ?? undefined,
    equipmentId: row.equipmentId,
    clientName: row.clientName,
    manufacturer: row.manufacturer ?? undefined,
    model: row.model ?? undefined,
    province: row.province,
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantType: row.refrigerantType,
    refrigerantClass: (row.refrigerantClass ?? undefined) as EquipmentRecord['refrigerantClass'],
    ashraeSafetyClass: row.ashraeSafetyClass as EquipmentRecord['ashraeSafetyClass'],
    serialNumber: row.serialNumber ?? undefined,
    healthStatus: (row.healthStatus ?? undefined) as EquipmentRecord['healthStatus'],
    lastServiceDate: row.lastServiceDate,
    nextServiceDue: row.nextServiceDue,
    status: row.status as EquipmentRecord['status'],
    technicianName: row.technicianName,
    serviceHistory: row.serviceHistory as EquipmentRecord['serviceHistory'],
    predictedFailureReason: row.predictedFailureReason ?? undefined,
    recommendedAction: row.recommendedAction ?? undefined,
  };
}

export async function GET(req: Request) {
  try {
    requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db.select().from(equipmentRecords);
  return NextResponse.json(rows.map(toEquipmentRecord));
}
