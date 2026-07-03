CREATE TABLE "ocr_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"technician_name" text NOT NULL,
	"raw_text" text NOT NULL,
	"refrigerant_code" text,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"match_confidence" numeric(4, 3),
	"whatgas_refrigerant_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
