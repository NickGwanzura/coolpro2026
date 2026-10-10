ALTER TYPE "public"."email_log_status" ADD VALUE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."email_log_status" ADD VALUE 'bounced';--> statement-breakpoint
ALTER TYPE "public"."email_log_status" ADD VALUE 'complained';--> statement-breakpoint
ALTER TYPE "public"."email_log_status" ADD VALUE 'delayed';--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "related_label" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "provider_message_id" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "status_updated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "email_log_sent_at_idx" ON "email_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_log_provider_id_idx" ON "email_log" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "email_log_recipient_idx" ON "email_log" USING btree ("recipient_email");