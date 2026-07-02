ALTER TYPE "public"."user_role" ADD VALUE 'student';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "supplier_applications" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "student_applications" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "technician_applications" ADD COLUMN "password_hash" text;