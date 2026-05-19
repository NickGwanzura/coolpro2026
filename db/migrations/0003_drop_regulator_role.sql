--> statement-breakpoint
-- Convert any existing 'regulator' users to 'org_admin' before altering the enum
UPDATE "users" SET "role" = 'org_admin' WHERE "role" = 'regulator';
--> statement-breakpoint
-- Create a new enum type without 'regulator'
CREATE TYPE "public"."user_role_new" AS ENUM('technician', 'trainer', 'lecturer', 'vendor', 'org_admin');
--> statement-breakpoint
-- Alter the users.role column to use the new type (casting via text)
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_new" USING "role"::text::"public"."user_role_new";
--> statement-breakpoint
-- Drop the old enum type
DROP TYPE "public"."user_role";
--> statement-breakpoint
-- Rename the new enum to the original name
ALTER TYPE "public"."user_role_new" RENAME TO "user_role";
