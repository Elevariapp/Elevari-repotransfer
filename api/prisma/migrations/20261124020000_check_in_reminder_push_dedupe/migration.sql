-- Marks the bookings whose check-in reminder push was already sent, so the 6-hourly job does not
-- repeat it. Additive and nullable: existing rows simply have not been reminded yet.

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "check_in_reminder_pushed_at" TIMESTAMP(3);
