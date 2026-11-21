import 'dotenv/config';
import { buildApp } from './app.js';
import { getPaymentsConfig } from './lib/payments/config.js';
import { startPendingBookingExpiryJob } from './jobs/expire-pending-bookings.js';
import { startOtaCalendarSyncJob } from './jobs/sync-ota-calendars.js';
import { startCheckInReminderJob } from './jobs/send-check-in-reminders.js';
import { assertJwtSecret } from './lib/auth.js';

// Startup validation — fail fast on bad production configuration.
assertJwtSecret();
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.TURNSTILE_SECRET_KEY || ['1', 'true'].includes(process.env.TURNSTILE_DISABLED ?? ''))
) {
  throw new Error('Turnstile must be enabled in production: set TURNSTILE_SECRET_KEY and do not disable it.');
}
const paymentsConfig = getPaymentsConfig();
if (
  process.env.NODE_ENV === 'production' &&
  paymentsConfig.mode === 'mock' &&
  process.env.ALLOW_MOCK_PAYMENTS !== 'true'
) {
  throw new Error(
    'PAYMENTS_MODE=mock is not allowed in production (mock endpoints complete payments without charging). ' +
      'Set PAYMENTS_MODE=live with the Wompi keys.',
  );
}
console.log(
  `[payments] mode=${paymentsConfig.mode} wompi=${paymentsConfig.wompiEnabled ? 'enabled' : 'disabled'}` +
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
  console.log(`Elevari API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
