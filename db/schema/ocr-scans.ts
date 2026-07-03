import { pgTable, text, timestamp, uuid, numeric, integer } from 'drizzle-orm/pg-core';

// Nameplate OCR scan history — one row per scan a technician runs in Field Toolkit.
// whatGasRefrigerantId links back to the refrigerants table when the extracted code matched.
export const ocrScans = pgTable('ocr_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  technicianId: uuid('technician_id').notNull(),
  technicianName: text('technician_name').notNull(),
  rawText: text('raw_text').notNull(),
  refrigerantCode: text('refrigerant_code'),
  manufacturer: text('manufacturer'),
  model: text('model'),
  serialNumber: text('serial_number'),
  matchConfidence: numeric('match_confidence', { precision: 4, scale: 3 }),
  whatGasRefrigerantId: integer('whatgas_refrigerant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
