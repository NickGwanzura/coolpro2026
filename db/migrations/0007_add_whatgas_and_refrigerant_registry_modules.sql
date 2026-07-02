CREATE TYPE "public"."whatgas_sync_status" AS ENUM('running', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."whatgas_sync_type" AS ENUM('manual', 'daily-incremental', 'weekly-full');--> statement-breakpoint
CREATE TYPE "public"."cylinder_owner_type" AS ENUM('technician', 'supplier', 'company');--> statement-breakpoint
CREATE TYPE "public"."cylinder_status" AS ENUM('full', 'partial', 'empty', 'in-service', 'scrapped');--> statement-breakpoint
CREATE TYPE "public"."permit_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."permit_type" AS ENUM('import', 'export');--> statement-breakpoint
CREATE TYPE "public"."reclamation_status" AS ENUM('pending', 'passed', 'failed');--> statement-breakpoint
CREATE TABLE "refrigerants" (
	"id" integer PRIMARY KEY NOT NULL,
	"ods_name" text,
	"ashrae_code" text,
	"ashrae_type_id" integer,
	"ashrae_type_name" text,
	"chemical_type" text,
	"cas_code" text,
	"formula_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alternative_formula_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"chemical_name_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alternative_chemical_name_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_trade_name_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"real_applications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"danger_symbol" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gwp" text,
	"gwp_source" text,
	"gwp_note" text,
	"odp" text,
	"odp_source" text,
	"odp_note" text,
	"mp_value" text,
	"mp_source" text,
	"mp_note" text,
	"kigali_gwp_value" text,
	"kigali_gwp_source" text,
	"ashrae_safety_group" text,
	"flammability" text,
	"toxicity" text,
	"annex_group_id" integer,
	"annex_group_name" text,
	"is_ctrl_montreal_protocol" boolean,
	"hs_code" text,
	"hs_code_2017" text,
	"hs_code_2022" text,
	"un_code" text,
	"is_hfc" boolean DEFAULT false NOT NULL,
	"is_hcfc" boolean DEFAULT false NOT NULL,
	"is_cfc" boolean DEFAULT false NOT NULL,
	"is_odp" boolean DEFAULT false NOT NULL,
	"is_gwp" boolean DEFAULT false NOT NULL,
	"is_single" boolean DEFAULT false NOT NULL,
	"has_icon" boolean DEFAULT false NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"detail_fetched_at" timestamp with time zone,
	"last_updated" timestamp with time zone,
	"raw" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatgas_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" "whatgas_sync_type" NOT NULL,
	"status" "whatgas_sync_status" DEFAULT 'running' NOT NULL,
	"total_records" integer DEFAULT 0 NOT NULL,
	"created_records" integer DEFAULT 0 NOT NULL,
	"updated_records" integer DEFAULT 0 NOT NULL,
	"failed_records" integer DEFAULT 0 NOT NULL,
	"failures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duration_ms" integer,
	"triggered_by" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cylinders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cylinder_code" text NOT NULL,
	"refrigerant_id" integer,
	"refrigerant_label" text NOT NULL,
	"owner_type" "cylinder_owner_type" NOT NULL,
	"owner_id" text,
	"owner_name" text NOT NULL,
	"capacity_kg" numeric(8, 2) NOT NULL,
	"current_fill_kg" numeric(8, 2) DEFAULT '0' NOT NULL,
	"status" "cylinder_status" DEFAULT 'empty' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"last_filled_date" text,
	"last_inspection_date" text,
	"next_inspection_due" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cylinders_cylinder_code_unique" UNIQUE("cylinder_code")
);
--> statement-breakpoint
CREATE TABLE "trade_permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit_number" text NOT NULL,
	"permit_type" "permit_type" NOT NULL,
	"applicant_name" text NOT NULL,
	"applicant_company" text NOT NULL,
	"applicant_email" text NOT NULL,
	"refrigerant_id" integer,
	"refrigerant_label" text NOT NULL,
	"quantity_kg" numeric(10, 3) NOT NULL,
	"country_of_origin_or_destination" text NOT NULL,
	"status" "permit_status" DEFAULT 'pending' NOT NULL,
	"issued_date" text,
	"expiry_date" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_permits_permit_number_unique" UNIQUE("permit_number")
);
--> statement-breakpoint
CREATE TABLE "reclamation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" text NOT NULL,
	"refrigerant_id" integer,
	"refrigerant_label" text NOT NULL,
	"source_description" text NOT NULL,
	"quantity_kg" numeric(10, 3) NOT NULL,
	"purity_percent" numeric(5, 2),
	"test_method" text,
	"facility_name" text NOT NULL,
	"technician_id" uuid,
	"technician_name" text NOT NULL,
	"status" "reclamation_status" DEFAULT 'pending' NOT NULL,
	"tested_date" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reclamation_records_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "recycling_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid,
	"refrigerant_id" integer,
	"refrigerant_label" text NOT NULL,
	"quantity_kg" numeric(10, 3) NOT NULL,
	"method" text DEFAULT 'on-site-recycling' NOT NULL,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"job_site" text NOT NULL,
	"recycled_date" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gas_usage_logs" ADD COLUMN "refrigerant_id" integer;--> statement-breakpoint
ALTER TABLE "planner_jobs" ADD COLUMN "refrigerant_id" integer;--> statement-breakpoint
ALTER TABLE "equipment_records" ADD COLUMN "refrigerant_id" integer;--> statement-breakpoint
CREATE INDEX "refrigerants_search_text_idx" ON "refrigerants" USING btree ("search_text");--> statement-breakpoint
CREATE INDEX "refrigerants_ashrae_code_idx" ON "refrigerants" USING btree ("ashrae_code");