ALTER TABLE "technicians" ADD COLUMN "survey_data" jsonb;--> statement-breakpoint
ALTER TABLE "technician_applications" ADD COLUMN "survey_data" jsonb;