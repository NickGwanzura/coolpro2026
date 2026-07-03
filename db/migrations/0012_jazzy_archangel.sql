CREATE TYPE "public"."coc_request_status" AS ENUM('submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "coc_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" text NOT NULL,
	"planner_job_id" uuid,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"client_name" text NOT NULL,
	"location" text NOT NULL,
	"equipment_type" text NOT NULL,
	"serial_number" text,
	"installation_date" text NOT NULL,
	"details" text,
	"compliance_check" boolean DEFAULT false NOT NULL,
	"status" "coc_request_status" DEFAULT 'submitted' NOT NULL,
	"verification_token" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"issued_date" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coc_requests_certificate_number_unique" UNIQUE("certificate_number")
);
