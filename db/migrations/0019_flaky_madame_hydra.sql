CREATE TYPE "public"."contractor_application_status" AS ENUM('invited', 'submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'contractor';--> statement-breakpoint
CREATE TABLE "contractor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"company_name" text,
	"contact_name" text,
	"phone" text,
	"region" text NOT NULL,
	"trade_specialization" text,
	"years_in_operation" text,
	"team_size" text,
	"services_offered" jsonb DEFAULT '[]'::jsonb,
	"has_safety_certification" text,
	"biggest_challenge" text,
	"invited_by" text NOT NULL,
	"status" "contractor_application_status" DEFAULT 'invited' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_note" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contractor_applications_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "installation_id" uuid;--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "checklist_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "coc_requests" ADD COLUMN "evidence_images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "checklist_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "coc_request_id" uuid;