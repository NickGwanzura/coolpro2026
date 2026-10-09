CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollments_course_user_unique" UNIQUE("course_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "pass_mark" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "cpd_credits" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainer_certificate_requests" ADD COLUMN "exam_submission_id" uuid;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Learners who already submitted an exam keep access: enrol them in those courses.
INSERT INTO "course_enrollments" ("course_id", "user_id")
SELECT DISTINCT "course_id", "student_id" FROM "exam_submissions"
ON CONFLICT ("course_id", "user_id") DO NOTHING;
