ALTER TABLE "blogs" ADD COLUMN "subtitle" text;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "author_id" uuid;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "approval_status" text DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "discount_percentage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "approval_status" text DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "seminars" ADD COLUMN "approval_status" text DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "successful_payments" uuid[] DEFAULT '{}' NOT NULL;