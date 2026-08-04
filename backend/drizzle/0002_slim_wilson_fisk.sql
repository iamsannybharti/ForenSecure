ALTER TABLE "courses" ADD COLUMN "sub_title" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "overview" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "highlights" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "eligibility" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "learningResources" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "careerBenefits" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "assessment_structure" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "passing_criteria" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "schedule" jsonb;