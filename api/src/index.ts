import 'dotenv/config';
import { buildApp } from './app.js';
import { getPaymentsConfig } from './lib/payments/config.js';
import { startPendingBookingExpiryJob } from './jobs/expire-pending-bookings.js';
import { startOtaCalendarSyncJob } from './jobs/sync-ota-calendars.js';
import { startCheckInReminderJob } from './jobs/send-check-in-reminders.js';

// Startup validation — fail fast on partial payment configuration.
const paymentsConfig = getPaymentsConfig();
console.log(
  `[payments] mode=${paymentsConfig.mode} wompi=${paymentsConfig.wompiEnabled ? 'enabled' : 'disabled'}` +
    ` bold=${paymentsConfig.boldEnabled ? 'enabled' : 'disabled'} stripe=${paymentsConfig.stripeEnabled ? 'enabled' : 'disabled'}` +
    (paymentsConfig.wompi ? ` wompi_env=${paymentsConfig.wompi.env}` : ''),
);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildApp();

try {
  await app.listen({ port, host });
  startPendingBookingExpiryJob(app.log);
  startOtaCalendarSyncJob(app.log);
  startCheckInReminderJob(app.log);
  console.log(`Waná API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
