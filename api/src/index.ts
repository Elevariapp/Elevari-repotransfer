import 'dotenv/config';
import { validateWompiEnvironment } from './lib/payments/wompi-provider.js';
import { buildApp } from './app.js';
import { startPendingBookingExpiryJob } from './jobs/expire-pending-bookings.js';
import { startOtaCalendarSyncJob } from './jobs/sync-ota-calendars.js';
import { startCheckInReminderJob } from './jobs/send-check-in-reminders.js';

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  validateWompiEnvironment();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Invalid Wompi configuration';
  console.error(`[CONFIG][WOMPI][INVALID] ${message}`);
  process.exit(1);
}

const app = await buildApp();

try {
  await app.listen({ port, host });
  startPendingBookingExpiryJob(app.log);
  startOtaCalendarSyncJob(app.log);
  startCheckInReminderJob(app.log);
  app.log.info({ host, port }, '[API][STARTUP][READY] Waná API listening');
} catch (err) {
  app.log.error(err, '[API][STARTUP][FAILED] Unable to start API');
  process.exit(1);
}
