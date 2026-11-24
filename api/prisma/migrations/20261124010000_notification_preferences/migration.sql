-- Notification preferences: which optional e-mails and push notifications a user wants.
-- Additive and nullable: NULL (every existing row) means "the defaults", so nothing changes for
-- anyone until they open the settings screen.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notification_prefs" JSONB;
