import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID, createHash } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { createProviderIntent, resolveProvider } from '../lib/payments/router.js';
import { getPaymentsConfig, assertIntlCheckoutAllowed } from '../lib/payments/config.js';
import { confirmPaymentSuccess, markPaymentFailed } from '../lib/payments/confirm-payment.js';
import { assertPaymentTransition } from '../lib/payments/payment-state.js';
import { createFxQuote, assertQuoteValid } from '../lib/payments/fx.js';
import { toMinorUnits } from '../lib/payments/money.js';
import {
  buildDisclosureText,
  hashDisclosure,
  normalizeLocale,
  DISCLOSURE_VERSION,
} from '../lib/payments/disclosure.js';
import { recordPaymentEvent, newCorrelationId } from '../lib/payments/events.js';
import { syncWompiPayment, verifyWompiWebhook, parseWompiWebhook } from '../lib/payments/wompi-provider.js';
import type { WompiEventPayload } from '../lib/payments/wompi-provider.js';
import { issuePaymentRefund } from '../lib/refund-payment.js';
import {
  accessErrorReply,
  getBookingForGuestOrAdmin,
  getPaymentForGuestOrAdmin,
} from '../lib/booking-access.js';
import { authenticate } from '../plugins/auth.js';

const intentSchema = z.object({
  booking_id: z.string().uuid(),
  idempotency_key: z.string().min(8).max(128),
  return_url: z.string().url(),
  display_currency: z.enum(['COP', 'USD']).default('COP'),
  quote_id: z.string().uuid().optional(),
  locale: z.enum(['es', 'en']).optional(),
  disclosure: z
    .object({
      version: z.string(),
      hash: z.string(),
      accepted: z.literal(true),
    })
    .optional(),
});

function getTotalFromFees(fees: unknown): number {
  if (!fees || typeof fees !== 'object') return 0;
  const f = fees as { total_charge_to_guest?: number };
  return Number(f.total_charge_to_guest ?? 0);
}

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/payments/intent', { preHandler: authenticate }, async (request, reply) => {
    const body = intentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { booking_id, idempotency_key, return_url, display_currency, quote_id, disclosure } = body.data;
    const locale = normalizeLocale(body.data.locale);
    const correlationId = newCorrelationId();

    const access = await getBookingForGuestOrAdmin(booking_id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: idempotency_key },
    });

    if (existing) {
      if (existing.bookingId !== booking_id) {
        return reply.status(409).send({ error: 'Idempotency key belongs to another booking' });
      }

      if (existing.status === 'succeeded') {
        return reply.send({ payment: existing, reused: true, already_paid: true });
      }

      if (existing.metadata && typeof existing.metadata === 'object') {
        const meta = existing.metadata as Record<string, unknown>;
        return reply.send({
          payment: existing,
          reused: true,
          checkout_url: meta.checkout_url,
          client_secret: meta.client_secret,
          publishable_key: meta.publishable_key,
          provider: existing.provider,
          mode: meta.mode ?? 'live',
        });
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: { property: { select: { title: true, country: true } } },
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending_payment') {
      return reply.status(400).send({
        error: `Booking is not payable (status: ${booking.status})`,
      });
    }

    const alreadyPaid = await prisma.payment.findFirst({
      where: { bookingId: booking_id, status: 'succeeded' },
    });
    if (alreadyPaid) {
      return reply.status(409).send({
        error: 'Booking already paid',
        payment_id: alreadyPaid.id,
      });
    }

    const amount = getTotalFromFees(booking.feesBreakdown);
    if (amount <= 0) {
      return reply.status(400).send({ error: 'Invalid booking amount' });
    }

    // FX quote — charge COP, display per request. International requires legal gate.
    const isInternational = display_currency !== 'COP';
    if (isInternational) {
      try {
        assertIntlCheckoutAllowed();
      } catch (err) {
        return reply.status(403).send({
          error: err instanceof Error ? err.message : 'International checkout blocked',
          code: 'INTERNATIONAL_CHECKOUT_BLOCKED',
        });
      }
    }

    let quote;
    if (quote_id) {
      try {
        quote = await assertQuoteValid(quote_id, booking_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid quote';
        const status = msg === 'QUOTE_EXPIRED' ? 410 : 400;
        return reply.status(status).send({ error: msg, code: msg });
      }
    } else {
      quote = await createFxQuote({
        bookingId: booking_id,
        chargeAmountCopMajor: amount,
        displayCurrency: display_currency,
      });
    }

    // Disclosure — mandatory for international (display ≠ charge).
    if (isInternational) {
      if (quote.disclosureAcceptedAt) {
        // previously accepted on this quote — ok
      } else {
        if (!disclosure) {
          const text = buildDisclosureText(
            {
              chargeAmountMinor: quote.chargeAmountMinor,
              chargeCurrency: quote.chargeCurrency,
              displayAmountMinor: quote.displayAmountMinor,
              displayCurrency: quote.displayCurrency,
              rate: Number(quote.rate),
              lockedAt: quote.lockedAt,
              expiresAt: quote.expiresAt,
            },
            locale,
          );
          await recordPaymentEvent({
            type: 'fx_quote_shown',
            correlationId,
            bookingId: booking_id,
            quoteId: quote.id,
            payload: { display_currency: quote.displayCurrency },
          });
          return reply.status(428).send({
            error: 'DISCLOSURE_REQUIRED',
            code: 'DISCLOSURE_REQUIRED',
            disclosure: {
              version: DISCLOSURE_VERSION,
              locale,
              text,
              hash: hashDisclosure(text),
            },
            quote: {
              id: quote.id,
              charge_currency: quote.chargeCurrency,
              charge_amount_minor: quote.chargeAmountMinor,
              display_currency: quote.displayCurrency,
              display_amount_minor: quote.displayAmountMinor,
              rate: Number(quote.rate),
              expires_at: quote.expiresAt,
            },
          });
        }

        const text = buildDisclosureText(
          {
            chargeAmountMinor: quote.chargeAmountMinor,
            chargeCurrency: quote.chargeCurrency,
            displayAmountMinor: quote.displayAmountMinor,
            displayCurrency: quote.displayCurrency,
            rate: Number(quote.rate),
            lockedAt: quote.lockedAt,
            expiresAt: quote.expiresAt,
          },
          locale,
        );
        const expectedHash = hashDisclosure(text);
        if (disclosure.version !== DISCLOSURE_VERSION || disclosure.hash !== expectedHash) {
          return reply.status(400).send({
            error: 'Disclosure hash mismatch — the quote may have changed. Request a fresh disclosure.',
            code: 'DISCLOSURE_MISMATCH',
          });
        }

        await prisma.fxQuote.update({
          where: { id: quote.id },
          data: {
            disclosureVersion: disclosure.version,
            disclosureLocale: locale,
            disclosureHash: disclosure.hash,
            disclosureAcceptedAt: new Date(),
          },
        });
        await recordPaymentEvent({
          type: 'fx_disclosure_accepted',
          correlationId,
          bookingId: booking_id,
          quoteId: quote.id,
          payload: { version: disclosure.version, locale, hash: disclosure.hash },
        });
      }
    }

    const currency = 'COP';
    const provider = resolveProvider(currency, booking.property.country);

    let payment = existing;
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId: booking_id,
          provider,
          amount,
          currency,
          status: 'pending',
          idempotencyKey: idempotency_key,
        },
      });
    }

    await recordPaymentEvent({
      type: 'payment_intent_created',
      correlationId,
      paymentId: payment.id,
      bookingId: booking_id,
      quoteId: quote.id,
      payload: { provider, amount, currency },
    });

    try {
      const result = await createProviderIntent(
        provider,
        {
          bookingId: booking_id,
          amount,
          currency,
          idempotencyKey: idempotency_key,
          description: `Reserva Waná — ${booking.property.title}`,
          guestEmail: booking.guestEmail ?? '',
          guestName: booking.guestName ?? 'Huésped',
          returnUrl: return_url,
        },
        payment.id,
      );

      assertPaymentTransition(payment.status, 'processing');
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: result.externalId ?? null,
          status: 'processing',
          metadata: {
            checkout_url: result.checkoutUrl,
            client_secret: result.clientSecret,
            publishable_key: result.publishableKey,
            mode: result.mode,
            quote_id: quote.id,
            charge_amount_minor: quote.chargeAmountMinor,
            display_currency: quote.displayCurrency,
            display_amount_minor: quote.displayAmountMinor,
            quote_rate: Number(quote.rate),
            quote_timestamp: quote.lockedAt.toISOString(),
          },
        },
      });

      return reply.status(201).send({
        payment_id: payment.id,
        provider: result.provider,
        mode: result.mode,
        checkout_url: result.checkoutUrl,
        client_secret: result.clientSecret,
        publishable_key: result.publishableKey,
        amount,
        currency,
        quote: {
          id: quote.id,
          charge_currency: quote.chargeCurrency,
          charge_amount_minor: quote.chargeAmountMinor,
          display_currency: quote.displayCurrency,
          display_amount_minor: quote.displayAmountMinor,
          rate: Number(quote.rate),
          expires_at: quote.expiresAt,
        },
      });
    } catch (err) {
      assertPaymentTransition(payment.status, 'failed');
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      await recordPaymentEvent({
        type: 'payment_intent_failed',
        correlationId,
        paymentId: payment.id,
        bookingId: booking_id,
        quoteId: quote.id,
        payload: { error: err instanceof Error ? err.message : 'unknown' },
      });
      return reply.status(502).send({
        error: err instanceof Error ? err.message : 'Payment provider error',
      });
    }
  });

  app.get('/payments/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const access = await getPaymentForGuestOrAdmin(id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            property: { select: { title: true, slug: true, city: true } },
          },
        },
      },
    });

    return { payment };
  });

  app.get('/payments/:id/timeline', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const access = await getPaymentForGuestOrAdmin(id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const events = await prisma.paymentEvent.findMany({
      where: { paymentId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { events };
  });

  app.get('/payments/by-booking/:bookingId', { preHandler: authenticate }, async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string };
    const access = await getBookingForGuestOrAdmin(bookingId, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { payments };
  });

  app.post('/payments/:id/sync', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const correlationId = newCorrelationId();

    const access = await getPaymentForGuestOrAdmin(id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const payment = access.payment;

    if (payment.status === 'succeeded') {
      return { status: 'succeeded', booking_id: payment.bookingId };
    }

    const meta = (payment.metadata ?? {}) as Record<string, unknown>;
    const reference = payment.idempotencyKey;

    let sync;
    if (payment.provider !== 'wompi') {
      return reply.status(400).send({ error: `Unsupported provider: ${payment.provider}` });
    }
    sync = await syncWompiPayment(reference);

    if (sync.paid) {
      const result = await confirmPaymentSuccess({
        paymentId: payment.id,
        externalId: sync.externalId ?? payment.externalId ?? payment.id,
        raw: sync.raw,
      });
      await recordPaymentEvent({
        type: isInternationalPayment(meta) ? 'payment_paid_international' : 'payment_paid',
        correlationId,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        payload: { source: 'sync' },
      });
      return {
        status: 'succeeded',
        booking_id: result.bookingId,
        refund_required: result.refundRequired ?? false,
      };
    }

    if (sync.declined && (payment.status === 'pending' || payment.status === 'processing')) {
      await markPaymentFailed(payment.id, 'Provider reported declined', sync.raw);
      await recordPaymentEvent({
        type: isInternationalPayment(meta) ? 'payment_failed_international' : 'payment_failed',
        correlationId,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        payload: { source: 'sync' },
      });
      return { status: 'failed' };
    }

    return { status: payment.status };
  });

  app.post('/payments/:id/refund', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (request.auth!.role !== 'admin') {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    const body = (request.body ?? {}) as { amount_minor?: number; reason?: string };
    const correlationId = newCorrelationId();

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }

    const chargedMinor = toMinorUnits(Number(payment.amount));
    const refundMinor = body.amount_minor ?? chargedMinor;

    if (!Number.isInteger(refundMinor) || refundMinor <= 0 || refundMinor > chargedMinor) {
      return reply.status(400).send({ error: 'Invalid refund amount (minor units)' });
    }

    const result = await issuePaymentRefund(payment, refundMinor / 100);

    await recordPaymentEvent({
      type: 'refund_requested',
      correlationId,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      payload: { amount_minor: refundMinor, status: result.status, reason: body.reason },
    });

    if (result.status === 'failed') {
      return reply.status(502).send(result);
    }
    return result;
  });

  app.post('/payments/:id/mock-complete', { preHandler: authenticate }, async (request, reply) => {
    if (process.env.PAYMENTS_MODE !== 'mock' && process.env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Mock payments disabled' });
    }

    const { id } = request.params as { id: string };
    const access = await getPaymentForGuestOrAdmin(id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    const result = await confirmPaymentSuccess({
      paymentId: id,
      externalId: `mock_${id}`,
      raw: { mock: true },
    });

    await recordPaymentEvent({
      type: 'payment_paid',
      correlationId: newCorrelationId(),
      paymentId: id,
      bookingId: result.bookingId,
      payload: { source: 'mock' },
    });

    return {
      status: 'succeeded',
      booking_id: result.bookingId,
      refund_required: result.refundRequired ?? false,
    };
  });

  app.post('/payments/:id/mock-fail', { preHandler: authenticate }, async (request, reply) => {
    if (process.env.PAYMENTS_MODE !== 'mock' && process.env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Mock payments disabled' });
    }

    const { id } = request.params as { id: string };
    const access = await getPaymentForGuestOrAdmin(id, request.auth!);
    if ('error' in access) {
      const err = accessErrorReply(access.error);
      return reply.status(err.status).send(err.body);
    }

    await markPaymentFailed(id, 'Mock failure', { mock: true });
    return { status: 'failed' };
  });
}

function isInternationalPayment(meta: Record<string, unknown>): boolean {
  return typeof meta.display_currency === 'string' && meta.display_currency !== 'COP';
}

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

export async function webhookRoutes(app: FastifyInstance) {
  const cfg = getPaymentsConfig();

  app.post('/webhooks/wompi', async (request, reply) => {
    const payload = request.body as WompiEventPayload;

    if (!verifyWompiWebhook(payload)) {
      request.log.warn({ correlationId: newCorrelationId() }, 'Wompi webhook signature invalid');
      return reply.status(401).send({ error: 'Invalid webhook signature' });
    }

    const parsed = parseWompiWebhook(payload);
    if (!parsed.reference) {
      return reply.send({ received: true, skipped: true });
    }

    // Dedupe — event id = hash of transaction id + status + timestamp.
    const eventKey = createHash('sha256')
      .update(`${parsed.transactionId}:${parsed.status}:${payload.timestamp}`)
      .digest('hex');
    const dedupeKey = `wompi_evt_${eventKey}`;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ idempotencyKey: parsed.reference }, { externalId: parsed.transactionId }],
      },
    });

    if (!payment) {
      request.log.warn({ reference: parsed.reference }, 'Wompi webhook for unknown payment');
      return reply.status(404).send({ error: 'Payment not found for webhook' });
    }

    const alreadyProcessed = await prisma.paymentEvent.findFirst({
      where: { paymentId: payment.id, type: 'webhook_applied', payload: { path: ['dedupe_key'], equals: dedupeKey } },
    });
    if (alreadyProcessed) {
      return reply.send({ received: true, duplicate: true });
    }

    // Amount validation — webhook amount must match the frozen charge.
    const meta = (payment.metadata ?? {}) as Record<string, unknown>;
    const expectedMinor = typeof meta.charge_amount_minor === 'number'
      ? meta.charge_amount_minor
      : toMinorUnits(Number(payment.amount));
    if (parsed.amountMinor !== undefined && parsed.amountMinor !== expectedMinor) {
      await recordPaymentEvent({
        type: 'webhook_amount_mismatch',
        correlationId: newCorrelationId(),
        paymentId: payment.id,
        bookingId: payment.bookingId,
        payload: { expected: expectedMinor, got: parsed.amountMinor },
      });
      request.log.error({ paymentId: payment.id }, 'Wompi webhook amount mismatch — ignoring');
      return reply.status(409).send({ error: 'Amount mismatch' });
    }

    // Currency validation — the charge currency is frozen per payment (COP only).
    if (parsed.currency && payment.currency && parsed.currency !== payment.currency) {
      await recordPaymentEvent({
        type: 'webhook_currency_mismatch',
        correlationId: newCorrelationId(),
        paymentId: payment.id,
        bookingId: payment.bookingId,
        payload: { expected: payment.currency, got: parsed.currency },
      });
      request.log.error({ paymentId: payment.id }, 'Wompi webhook currency mismatch — ignoring');
      return reply.status(409).send({ error: 'Currency mismatch' });
    }

    if (parsed.status === 'APPROVED') {
      await confirmPaymentSuccess({
        paymentId: payment.id,
        externalId: parsed.transactionId ?? payment.externalId ?? payment.id,
        raw: payload,
      });
      await recordPaymentEvent({
        type: isInternationalPayment(meta) ? 'payment_paid_international' : 'payment_paid',
        correlationId: newCorrelationId(),
        paymentId: payment.id,
        bookingId: payment.bookingId,
        payload: { source: 'webhook', transaction: parsed.transactionId },
      });
    } else if (parsed.status === 'DECLINED' || parsed.status === 'ERROR' || parsed.status === 'VOIDED') {
      if (payment.status === 'pending' || payment.status === 'processing') {
        await markPaymentFailed(payment.id, `Wompi status ${parsed.status}`, payload);
        await recordPaymentEvent({
          type: isInternationalPayment(meta) ? 'payment_failed_international' : 'payment_failed',
          correlationId: newCorrelationId(),
          paymentId: payment.id,
          bookingId: payment.bookingId,
          payload: { source: 'webhook', status: parsed.status },
        });
      }
    }

    await recordPaymentEvent({
      type: 'webhook_applied',
      correlationId: newCorrelationId(),
      paymentId: payment.id,
      bookingId: payment.bookingId,
      payload: { dedupe_key: dedupeKey, event: parsed.eventType, status: parsed.status },
    });

    return reply.send({ received: true });
  });
}

