import { syncAllEnabledCalendarFeeds } from '../lib/ical/sync-feed.js';

export function startOtaCalendarSyncJob(log: {
  info: (obj: object, msg: string) => void;
  error: (err: unknown, msg: string) => void;
}): NodeJS.Timeout | null {
  if (process.env.ICAL_SYNC_ENABLED !== '1') {
    log.info({}, 'OTA calendar sync disabled (ICAL_SYNC_ENABLED!=1)');
    return null;
  }

  const intervalMs = Number(process.env.ICAL_SYNC_JOB_INTERVAL_MS ?? 10 * 60 * 1000);

  const run = async () => {
    try {
      const results = await syncAllEnabledCalendarFeeds();
      const summary = results.reduce(
        (acc, r) => {
          acc.imported += r.imported;
          acc.skipped += r.skipped;
          acc.removed += r.removed;
          if (r.error) acc.errors += 1;
          return acc;
        },
        { imported: 0, skipped: 0, removed: 0, errors: 0 },
      );

      if (results.length > 0) {
        log.info({ feeds: results.length, ...summary }, 'OTA calendar sync completed');
      }
    } catch (err) {
      log.error(err, 'OTA calendar sync job failed');
    }
  };

  void run();
  return setInterval(run, intervalMs);
}
