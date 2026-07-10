CREATE TYPE "public"."recycling_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."installation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('COLD_ROOM', 'C40_FREEZER', 'C60_FREEZER', 'C90_FREEZER', 'FREEZER_ROOM');--> statement-breakpoint
CREATE TYPE "public"."reward_redemption_status" AS ENUM('requested', 'fulfilled', 'rejected');--> statement-breakpoint
CREATE TABLE "installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"client_name" text NOT NULL,
	"location" text,
	"job_details" text NOT NULL,
	"floor_space" text,
	"job_type" "job_type" NOT NULL,
	"installation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"equipment_id" uuid,
	"status" "installation_status" DEFAULT 'pending' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coc_requested" boolean DEFAULT false NOT NULL,
	"coc_approved" boolean DEFAULT false NOT NULL,
	"coc_approval_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" text NOT NULL,
	"user_email" text NOT NULL,
	"user_role" "user_role" NOT NULL,
	"reward_id" text NOT NULL,
	"reward_title" text NOT NULL,
	"points_cost" integer NOT NULL,
	"status" "reward_redemption_status" DEFAULT 'requested' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "recycling_records" ADD COLUMN "status" "recycling_status" DEFAULT 'pending' NOT NULL;