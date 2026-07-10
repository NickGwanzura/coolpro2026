CREATE TYPE "public"."accident_investigation_status" AS ENUM('Open', 'Under Investigation', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."accident_severity" AS ENUM('Critical', 'High', 'Medium', 'Low');--> statement-breakpoint
CREATE TABLE "occupational_accidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"date" text NOT NULL,
	"job_site" text NOT NULL,
	"client_name" text NOT NULL,
	"severity" "accident_severity" NOT NULL,
	"description" text NOT NULL,
	"refrigerant_involved" text,
	"near_miss_flag" boolean DEFAULT false NOT NULL,
	"nou_notified" boolean DEFAULT false NOT NULL,
	"root_cause" text,
	"investigation_date" text,
	"investigator_name" text,
	"corrective_actions" text,
	"preventive_measures" text,
	"status" "accident_investigation_status" DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
