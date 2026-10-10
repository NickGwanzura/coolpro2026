ALTER TYPE "public"."planner_job_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "planner_jobs" ADD COLUMN "equipment_id" text;