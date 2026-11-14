/**
 * Runtime stub for @prisma/client in certification tests.
 * Only enum objects used as values (if any) need to exist here.
 */
export const PaymentStatus = {
  pending: 'pending',
  processing: 'processing',
  succeeded: 'succeeded',
  failed: 'failed',
  cancelled: 'cancelled',
  partially_refunded: 'partially_refunded',
  refunded: 'refunded',
};

export const BookingStatus = {
  draft: 'draft',
  pending_payment: 'pending_payment',
  confirmed: 'confirmed',
  checked_in: 'checked_in',
  completed: 'completed',
  cancelled: 'cancelled',
};

export const PrismaClient = class {
  constructor() {
    throw new Error('PrismaClient must not be instantiated in certification tests');
  }
};
