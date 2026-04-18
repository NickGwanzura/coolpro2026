CREATE TYPE "public"."user_role" AS ENUM('technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'regulator');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'pending_nou', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."exam_submission_status" AS ENUM('pending', 'graded');--> statement-breakpoint
CREATE TYPE "public"."rejected_by" AS ENUM('hevacraz', 'nou');--> statement-breakpoint
CREATE TYPE "public"."reorder_status" AS ENUM('pending_hevacraz', 'pending_nou', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('reg_number', 'qr', 'name');--> statement-breakpoint
CREATE TYPE "public"."verification_result" AS ENUM('valid', 'expired', 'revoked', 'not_found');--> statement-breakpoint
CREATE TYPE "public"."certification_status" AS ENUM('valid', 'expired', 'pending');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('employed', 'self-employed', 'unemployed');--> statement-breakpoint
CREATE TYPE "public"."technician_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"region" text NOT NULL,
	"registration_no" text,
	"qr_token" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lecturer_id" uuid NOT NULL,
	"lecturer_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"course_title" text NOT NULL,
	"student_id" uuid NOT NULL,
	"student_name" text NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" numeric(5, 2),
	"passed" boolean,
	"feedback" text,
	"status" "exam_submission_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"graded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "supplier_reorders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" text NOT NULL,
	"gas_type" text NOT NULL,
	"quantity_kg" numeric(10, 3) NOT NULL,
	"purpose" text NOT NULL,
	"supplier_notes" text DEFAULT '' NOT NULL,
	"status" "reorder_status" DEFAULT 'pending_hevacraz' NOT NULL,
	"hevacraz_reviewer_id" uuid,
	"hevacraz_reviewed_at" timestamp with time zone,
	"nou_reviewer_id" uuid,
	"nou_reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"rejected_by" "rejected_by",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technician_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" text NOT NULL,
	"method" "verification_method" NOT NULL,
	"query" text NOT NULL,
	"technician_id" uuid,
	"result" "verification_result" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"national_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"region" text NOT NULL,
	"province" text NOT NULL,
	"district" text NOT NULL,
	"contact_number" text NOT NULL,
	"email" text,
	"specialization" text NOT NULL,
	"certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"training_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"employment_status" "employment_status" DEFAULT 'employed' NOT NULL,
	"employer" text,
	"refrigerants_handled" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supplier_id" uuid,
	"registration_date" text NOT NULL,
	"expiry_date" text NOT NULL,
	"status" "technician_status" DEFAULT 'active' NOT NULL,
	"last_renewal_date" text,
	"next_renewal_date" text,
	"qr_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technicians_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;