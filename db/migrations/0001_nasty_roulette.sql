CREATE TYPE "public"."certificate_type" AS ENUM('distribution-compliance', 'nou-reporting', 'traceability-audit');--> statement-breakpoint
CREATE TYPE "public"."counterparty_type" AS ENUM('importer', 'distributor', 'technician', 'contractor', 'retailer', 'cold-chain-client');--> statement-breakpoint
CREATE TYPE "public"."supplier_application_status" AS ENUM('submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."supplier_compliance_status" AS ENUM('draft', 'submitted', 'under-review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."supplier_ledger_direction" AS ENUM('purchase', 'sale');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('importer', 'wholesaler', 'distributor', 'manufacturer', 'service-partner');--> statement-breakpoint
CREATE TABLE "supplier_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"trading_name" text,
	"registration_number" text DEFAULT '' NOT NULL,
	"supplier_type" "supplier_type" DEFAULT 'distributor' NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"refrigerants_supplied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tax_number" text,
	"pesepay_merchant_id" text,
	"website" text,
	"notes" text,
	"status" "supplier_application_status" DEFAULT 'submitted' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_note" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_compliance_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_email" text NOT NULL,
	"supplier_name" text NOT NULL,
	"certificate_type" "certificate_type" NOT NULL,
	"month_coverage" text NOT NULL,
	"sites_covered" numeric DEFAULT '1' NOT NULL,
	"contact_person" text DEFAULT '' NOT NULL,
	"supporting_summary" text DEFAULT '' NOT NULL,
	"status" "supplier_compliance_status" DEFAULT 'submitted' NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" text,
	"supplier_email" text NOT NULL,
	"supplier_name" text NOT NULL,
	"direction" "supplier_ledger_direction" NOT NULL,
	"technician_id" text,
	"technician_registration_number" text,
	"counterparty_name" text NOT NULL,
	"counterparty_company" text,
	"counterparty_type" "counterparty_type" NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"refrigerant" text NOT NULL,
	"quantity_kg" numeric(10, 3) NOT NULL,
	"unit_price_usd" numeric(10, 2) NOT NULL,
	"total_value_usd" numeric(12, 2) NOT NULL,
	"invoice_number" text NOT NULL,
	"transaction_date" timestamp with time zone NOT NULL,
	"reference_month" text NOT NULL,
	"reported_to_nou" boolean DEFAULT false NOT NULL,
	"client_reported" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
