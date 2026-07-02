import { pgTable, text, timestamp, numeric, uuid, integer } from 'drizzle-orm/pg-core';

export const recyclingRecords = pgTable('recycling_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  equipmentId: uuid('equipment_id'),
  refrigerantId: integer('refrigerant_id'),
  refrigerantLabel: text('refrigerant_label').notNull(),
  quantityKg: numeric('quantity_kg', { precision: 10, scale: 3 }).notNull(),
  method: text('method').notNull().default('on-site-recycling'),
  technicianId: uuid('technician_id').notNull(),
  technicianName: text('technician_name').notNull(),
  jobSite: text('job_site').notNull(),
  recycledDate: text('recycled_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
