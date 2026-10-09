CREATE TYPE "public"."registration_applicant_role" AS ENUM('trainer', 'lecturer', 'contractor');--> statement-breakpoint
CREATE TYPE "public"."registration_application_status" AS ENUM('submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "registration_applicant_role" NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"phone" text NOT NULL,
	"region" text NOT NULL,
	"organisation" text,
	"experience_summary" text NOT NULL,
	"details" jsonb,
	"id_document_name" text,
	"status" "registration_application_status" DEFAULT 'submitted' NOT NULL,
	"review_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_verifications_token_hash_idx" ON "email_verifications" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_verifications_entity_idx" ON "email_verifications" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "registration_applications_email_idx" ON "registration_applications" USING btree ("email");