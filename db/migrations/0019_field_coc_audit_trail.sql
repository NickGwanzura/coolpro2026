ALTER TABLE "installations" ADD COLUMN "checklist_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "coc_request_id" uuid;--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "installation_id" uuid;--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "checklist_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "evidence_images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coc_requests_installation_id_unique" ON "coc_requests" ("installation_id") WHERE "installation_id" IS NOT NULL;
