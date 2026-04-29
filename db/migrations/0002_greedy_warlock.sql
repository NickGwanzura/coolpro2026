CREATE TYPE "public"."student_application_status" AS ENUM('submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."technician_application_status" AS ENUM('submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "student_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"polytech" text NOT NULL,
	"field_of_study" text NOT NULL,
	"student_id_number" text NOT NULL,
	"enrolment_year" integer NOT NULL,
	"id_document_name" text,
	"status" "student_application_status" DEFAULT 'submitted' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_note" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technician_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"national_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"email" text NOT NULL,
	"contact_number" text NOT NULL,
	"province" text NOT NULL,
	"district" text NOT NULL,
	"region" text NOT NULL,
	"specialization" text NOT NULL,
	"employment_status" text DEFAULT 'employed' NOT NULL,
	"employer" text,
	"years_experience" integer DEFAULT 0 NOT NULL,
	"certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"refrigerants_handled" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "technician_application_status" DEFAULT 'submitted' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_note" text,
	"approved_technician_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
