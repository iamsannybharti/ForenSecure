CREATE TABLE "access_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text NOT NULL,
	"feature" text NOT NULL,
	"create" boolean DEFAULT false NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"update" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"author_name" text NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"author_name" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"read_time_minutes" integer DEFAULT 5 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" text NOT NULL,
	"student_name" text NOT NULL,
	"student_email" text NOT NULL,
	"course_name" text NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"cryptographic_hash" text NOT NULL,
	"grade" text DEFAULT 'A+' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"instructor_name" text NOT NULL,
	"instructor_title" text NOT NULL,
	"duration_weeks" integer NOT NULL,
	"course_type" text DEFAULT 'recorded' NOT NULL,
	"format" text DEFAULT 'course' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"thumbnail_url" text,
	"difficulty" text DEFAULT 'Beginner' NOT NULL,
	"rating" double precision DEFAULT 4.8 NOT NULL,
	"rating_count" integer DEFAULT 120 NOT NULL,
	"students_count" integer DEFAULT 1250 NOT NULL,
	"price_inr" integer NOT NULL,
	"discount_price_inr" integer,
	"syllabus" text[] DEFAULT '{}' NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"banner_svg_type" text DEFAULT 'fingerprint' NOT NULL,
	"promo_video_url" text,
	"visibility" text DEFAULT 'published' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"learningObjectives" text[] DEFAULT '{}' NOT NULL,
	"prerequisites" text[] DEFAULT '{}' NOT NULL,
	"targetAudience" text[] DEFAULT '{}' NOT NULL,
	"sub_title" text,
	"overview" text,
	"level" text,
	"highlights" text[] DEFAULT '{}' NOT NULL,
	"eligibility" text[] DEFAULT '{}' NOT NULL,
	"learningResources" text[] DEFAULT '{}' NOT NULL,
	"careerBenefits" text[] DEFAULT '{}' NOT NULL,
	"practicalLabs" text[] DEFAULT '{}' NOT NULL,
	"assessment_structure" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passing_criteria" text,
	"schedule" jsonb,
	"language" text DEFAULT 'English' NOT NULL,
	"seeking_mode" text DEFAULT 'free' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"version_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"course_qna" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"target_percentage" integer DEFAULT 60 NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dropdown_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"related_to" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"courses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sequential" boolean DEFAULT false NOT NULL,
	"issue_certificate" boolean DEFAULT true NOT NULL,
	"certificate_title" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"action_url" text DEFAULT '' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"course_id" uuid,
	"time_limit_minutes" integer DEFAULT 15 NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passing_percentage" integer DEFAULT 80 NOT NULL,
	"negative_marking" boolean DEFAULT false NOT NULL,
	"negative_mark_fraction" double precision DEFAULT 0.25 NOT NULL,
	"attempts_allowed" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"abstract" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"authors" text[] DEFAULT '{}' NOT NULL,
	"read_time_minutes" integer DEFAULT 8 NOT NULL,
	"citation" text NOT NULL,
	"published_date" timestamp with time zone DEFAULT now() NOT NULL,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"references" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seminars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructor_name" text NOT NULL,
	"course_id" uuid,
	"course_title" text,
	"date" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"link" text NOT NULL,
	"max_participants" integer DEFAULT 50 NOT NULL,
	"registeredStudents" text[] DEFAULT '{}' NOT NULL,
	"attendees" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"topic_title" text DEFAULT '' NOT NULL,
	"sub_topic_title" text DEFAULT '' NOT NULL,
	"timestamp" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"avatar" text,
	"bio" text,
	"enrolled_courses" uuid[] DEFAULT '{}' NOT NULL,
	"enrolled_paths" uuid[] DEFAULT '{}' NOT NULL,
	"completed_quizzes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"certificates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"course_progress" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"magic_token" text,
	"magic_token_expires" timestamp with time zone,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seminars" ADD CONSTRAINT "seminars_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "access_matrix_role_feature_idx" ON "access_matrix" USING btree ("role","feature");--> statement-breakpoint
CREATE UNIQUE INDEX "blogs_slug_idx" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_certificate_id_idx" ON "certificates" USING btree ("certificate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "courses_format_idx" ON "courses" USING btree ("format");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_paths_slug_idx" ON "learning_paths" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "research_slug_idx" ON "research" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "seminars_course_id_idx" ON "seminars" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "student_notes_user_course_idx" ON "student_notes" USING btree ("user_id","course_slug","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_enrolled_courses_idx" ON "users" USING gin ("enrolled_courses");