import type { AvailabilitySource, CalendarFeedChannel, PropertyCalendarFeed } from '@prisma/client';
import { prisma } from '../prisma.js';
import { isAvailabilityConflictError } from '../reserve-availability.js';
import { parseIcalEvents } from './parse-ical.js';

const FEED_USER_AGENT = 'Eleveri-CalendarSync/1.0';

function sourceForChannel(channel: CalendarFeedChannel): AvailabilitySource {
  return channel === 'airbnb' ? 'ota_airbnb' : 'ota_booking';
}

export interface SyncFeedResult {
  feedId: string;
  channel: CalendarFeedChannel;
  imported: number;
  skipped: number;
  removed: number;
  error?: string;
}

async function fetchIcal(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': FEED_USER_AGENT, Accept: 'text/calendar,*/*' },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`ICAL_FETCH_${response.status}`);
  }

  return response.text();
}

/** Upsert OTA blocks from one feed; never touches booking/manual/maintenance blocks. */
export async function syncCalendarFeed(feed: PropertyCalendarFeed): Promise<SyncFeedResult> {
  const source = sourceForChannel(feed.channel);
  let imported = 0;
  let skipped = 0;
  let removed = 0;
  let syncError: string | undefined;

  try {
    const raw = await fetchIcal(feed.importUrl);
    const events = parseIcalEvents(raw);
    const activeUids = events.map((e) => e.uid);

    await prisma.$transaction(async (tx) => {
      for (const event of events) {
        try {
          await tx.availabilityBlock.upsert({
            where: {
              propertyId_source_externalUid: {
                propertyId: feed.propertyId,
                source,
                externalUid: event.uid,
              },
            },
            create: {
              propertyId: feed.propertyId,
              startDate: event.startDate,
              endDate: event.endDate,
              source,
              externalUid: event.uid,
            },
            update: {
              startDate: event.startDate,
              endDate: event.endDate,
            },
          });
          imported += 1;
        } catch (err) {
          if (isAvailabilityConflictError(err)) {
            skipped += 1;
            continue;
          }
          throw err;
        }
      }

      if (activeUids.length === 0) {
        const deleteResult = await tx.availabilityBlock.deleteMany({
          where: {
            propertyId: feed.propertyId,
            source,
            externalUid: { not: null },
          },
        });
        removed = deleteResult.count;
      } else {
        const deleteResult = await tx.availabilityBlock.deleteMany({
          where: {
            propertyId: feed.propertyId,
            source,
            externalUid: { notIn: activeUids },
          },
        });
        removed = deleteResult.count;
      }

      await tx.propertyCalendarFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncedAt: new Date(),
          lastError: skipped > 0 ? `partial: ${skipped} event(s) overlapped existing blocks` : null,
          eventCountLastSync: imported,
          skippedLastSync: skipped,
        },
      });
    });
  } catch (err) {
    syncError = err instanceof Error ? err.message : 'ICAL_SYNC_FAILED';
    await prisma.propertyCalendarFeed.update({
      where: { id: feed.id },
      data: { lastError: syncError, skippedLastSync: skipped },
    });
  }

  return {
    feedId: feed.id,
    channel: feed.channel,
    imported,
    skipped,
    removed,
    error: syncError,
  };
}

/** Create/update feed rows from env (single-property bootstrap). */
export async function ensureCalendarFeedsFromEnv(): Promise<number> {
  if (process.env.ICAL_SYNC_ENABLED !== '1') return 0;

  const slug = process.env.ICAL_IMPORT_PROPERTY_SLUG?.trim();
  if (!slug) return 0;

  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!property) return 0;

  const pairs: Array<{ channel: CalendarFeedChannel; url: string | undefined }> = [
    { channel: 'airbnb', url: process.env.ICAL_IMPORT_AIRBNB_URL?.trim() },
    { channel: 'booking', url: process.env.ICAL_IMPORT_BOOKING_URL?.trim() },
  ];

  let upserted = 0;
  for (const { channel, url } of pairs) {
    if (!url) continue;

    await prisma.propertyCalendarFeed.upsert({
      where: { propertyId_channel: { propertyId: property.id, channel } },
      create: {
        propertyId: property.id,
        channel,
        importUrl: url,
        enabled: true,
      },
      update: { importUrl: url, enabled: true },
    });
    upserted += 1;
  }

  return upserted;
}

export async function syncAllEnabledCalendarFeeds(): Promise<SyncFeedResult[]> {
  await ensureCalendarFeedsFromEnv();

  const feeds = await prisma.propertyCalendarFeed.findMany({
    where: { enabled: true },
  });

  const results: SyncFeedResult[] = [];
  for (const feed of feeds) {
    results.push(await syncCalendarFeed(feed));
  }
  return results;
}
