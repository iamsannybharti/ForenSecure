ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "sub_title" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "overview" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "level" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "highlights" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "eligibility" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "learningResources" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "careerBenefits" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "practicalLabs" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "assessment_structure" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "passing_criteria" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "schedule" jsonb;