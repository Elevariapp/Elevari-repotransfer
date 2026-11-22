import { bookingConfirmation } from './email-templates/booking-confirmation';
import { bookingCancellation } from './email-templates/booking-cancellation';
import { checkInReminder } from './email-templates/check-in-reminder';
import { invoiceReceipt } from './email-templates/invoice-receipt';
import { passwordChanged } from './email-templates/password-changed';
import { passwordReset } from './email-templates/password-reset';
import { welcome } from './email-templates/welcome';
import { EMAIL_BRAND } from './email-templates/brand';

export const TRANSACTIONAL_EMAILS = {
  bookingConfirmation,
  bookingCancellation,
  checkInReminder,
  invoiceReceipt,
  passwordChanged,
  passwordReset,
  welcome,
};

export type TransactionalEmailType = keyof typeof TRANSACTIONAL_EMAILS;

export function getTransactionalEmail(type: TransactionalEmailType) {
  return TRANSACTIONAL_EMAILS[type];
}

export { EMAIL_BRAND };