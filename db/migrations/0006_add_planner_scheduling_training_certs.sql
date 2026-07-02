CREATE TYPE "public"."planner_job_status" AS ENUM('scheduled', 'in-progress', 'completed', 'follow-up');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('normal', 'due-soon', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."training_session_status" AS ENUM('scheduled', 'open', 'completed', 'full');--> statement-breakpoint
CREATE TYPE "public"."trainer_certificate_status" AS ENUM('draft', 'submitted-for-admin-approval', 'admin-approved', 'rejected', 'issued');--> statement-breakpoint
CREATE TABLE "planner_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"client_name" text NOT NULL,
	"location" text NOT NULL,
	"province" text NOT NULL,
	"district" text,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"job_type" text NOT NULL,
	"refrigerant_class" text NOT NULL,
	"refrigerant_type" text,
	"amount" numeric(10, 3),
	"scheduled_date" text NOT NULL,
	"status" "planner_job_status" DEFAULT 'scheduled' NOT NULL,
	"pre_job_checklist_complete" boolean DEFAULT false NOT NULL,
	"checklist_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" text NOT NULL,
	"client_id" text,
	"client_name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"province" text NOT NULL,
	"refrigerant_type" text NOT NULL,
	"refrigerant_class" text,
	"ashrae_safety_class" text NOT NULL,
	"serial_number" text,
	"health_status" text,
	"last_service_date" text NOT NULL,
	"next_service_due" text NOT NULL,
	"status" "equipment_status" DEFAULT 'normal' NOT NULL,
	"technician_name" text NOT NULL,
	"service_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"predicted_failure_reason" text,
	"recommended_action" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"venue" text NOT NULL,
	"province" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"fee_usd" numeric(10, 2) NOT NULL,
	"seats" integer NOT NULL,
	"seats_remaining" integer NOT NULL,
	"trainer_name" text NOT NULL,
	"trainer_email" text NOT NULL,
	"status" "training_session_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_certificate_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"technician_registration_number" text NOT NULL,
	"technician_company" text NOT NULL,
	"trainer_name" text NOT NULL,
	"trainer_email" text NOT NULL,
	"course_title" text NOT NULL,
	"exam_date" text NOT NULL,
	"theory_score" integer NOT NULL,
	"practical_score" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"notes" text,
	"status" "trainer_certificate_status" DEFAULT 'submitted-for-admin-approval' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"admin_reviewer" text,
	"certificate_number" text,
	"issued_at" timestamp with time zone,
	"verification_token" text,
	"cpd_credits" integer
);
