-- Host identity verification (Airbnb-style): government ID + selfie match.
-- Additive and nullable: existing hosts simply have idVerified = false.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "id_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "id_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN     "verification_id" TEXT;
ALTER TABLE "users" ADD COLUMN     "verification_status" TEXT;