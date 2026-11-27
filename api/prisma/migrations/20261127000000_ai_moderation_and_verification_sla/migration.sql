-- Automated (AI) moderation for host accounts, property photos/videos and ID verification.
-- Everything is additive and nullable: existing rows keep working, nothing is rewritten.

-- Host identity verification: persisted documents + machine verdict + 1-hour SLA timestamps.
ALTER TABLE "users" ADD COLUMN "verification_doc_url" TEXT;
ALTER TABLE "users" ADD COLUMN "verification_selfie_url" TEXT;
ALTER TABLE "users" ADD COLUMN "verification_id_number" TEXT;
ALTER TABLE "users" ADD COLUMN "verification_submitted_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "verification_reviewed_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "verification_verdict" TEXT;
ALTER TABLE "users" ADD COLUMN "verification_score" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "verification_reason" TEXT;

-- Property media: machine verdict + the deadline for a human decision (60 minutes).
ALTER TABLE "property_media" ADD COLUMN "ai_verdict" TEXT;
ALTER TABLE "property_media" ADD COLUMN "ai_score" DOUBLE PRECISION;
ALTER TABLE "property_media" ADD COLUMN "ai_labels" JSONB;
ALTER TABLE "property_media" ADD COLUMN "ai_reason" TEXT;
ALTER TABLE "property_media" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "property_media" ADD COLUMN "review_due_at" TIMESTAMP(3);

CREATE INDEX "property_media_status_review_due_at_idx" ON "property_media"("status", "review_due_at");
