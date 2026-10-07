ALTER TABLE "gas_usage_logs" ADD COLUMN "client_log_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "gas_usage_logs_client_log_id_idx" ON "gas_usage_logs" USING btree ("client_log_id");
