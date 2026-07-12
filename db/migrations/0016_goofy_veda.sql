CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'suspended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."email_log_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"application_id" uuid,
	"membership_number" text NOT NULL,
	"membership_type" text DEFAULT 'standard' NOT NULL,
	"province" text NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"start_date" text NOT NULL,
	"expiry_date" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_membership_number_unique" UNIQUE("membership_number")
);
--> statement-breakpoint
CREATE TABLE "application_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"performed_by" text NOT NULL,
	"performed_by_role" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"status" "email_log_status" NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
