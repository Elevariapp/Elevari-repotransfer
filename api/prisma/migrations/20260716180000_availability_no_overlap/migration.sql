-- P0-09: Prevent double-booking with DB-level exclusion on overlapping date ranges.
-- Semantics match app logic: [start_date, end_date) — check-out day is free for next guest.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "availability_blocks"
ADD CONSTRAINT "availability_blocks_valid_range"
CHECK ("end_date" > "start_date");

ALTER TABLE "availability_blocks"
ADD CONSTRAINT "availability_blocks_no_overlap"
EXCLUDE USING gist (
  "property_id" WITH =,
  daterange("start_date", "end_date", '[)') WITH &&
);
