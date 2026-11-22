-- Fase 1: import iCal desde Airbnb / Booking.com

ALTER TYPE "AvailabilitySource" ADD VALUE 'ota_airbnb';
ALTER TYPE "AvailabilitySource" ADD VALUE 'ota_booking';

CREATE TYPE "CalendarFeedChannel" AS ENUM ('airbnb', 'booking');

ALTER TABLE "availability_blocks" ADD COLUMN IF NOT EXISTS "external_uid" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "availability_blocks_property_id_source_external_uid_key"
ON "availability_blocks" ("property_id", "source", "external_uid");

CREATE TABLE "property_calendar_feeds" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "channel" "CalendarFeedChannel" NOT NULL,
    "import_url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "last_error" TEXT,
    "event_count_last_sync" INTEGER,
    "skipped_last_sync" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_calendar_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_calendar_feeds_property_id_channel_key"
ON "property_calendar_feeds"("property_id", "channel");

ALTER TABLE "property_calendar_feeds"
ADD CONSTRAINT "property_calendar_feeds_property_id_fkey"
FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
