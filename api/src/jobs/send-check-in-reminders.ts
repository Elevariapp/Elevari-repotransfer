import { prisma } from '../lib/prisma.js';
import { sendCheckInReminderEmails } from '../lib/transactional-emails.js';

export function startCheckInReminderJob(log: {
  info: (obj: object, msg: string) => void;
  error: (err: unknown, msg: string) => void;
}): NodeJS.Timeout {
  const intervalMs = Number(process.env.CHECKIN_REMINDER_JOB_INTERVAL_MS ?? 6 * 60 * 60 * 1000);

  const run = async () => {
    try {
      const result = await sendCheckInReminderEmails();
      if (result.sent > 0 || result.errors > 0) {
        log.info(result, 'Check-in reminder job completed');
      }
    } catch (err) {
      log.error(err, 'Check-in reminder job failed');
    }
  };

  void run();
  return setInterval(run, intervalMs);
}
