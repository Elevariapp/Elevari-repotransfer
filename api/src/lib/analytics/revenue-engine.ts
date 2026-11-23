/**
 * Revenue Analytics Engine - REV-5
 */
import type { BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { bookablePropertyWhere, type ScopeFilters } from './range.js';

export type RevenueFilters = ScopeFilters;

export interface RevenueMetrics {
  /** Captured guest payments (guest total, platform fee included). */
  grossRevenue: number;
  /** grossRevenue minus refunds. */
  netRevenue: number;
  refundsTotal: number;
  /** What the host receives (fees_breakdown.host_receives), reduced by any refunded share. */
  hostEarnings: number;
  bookingsCount: number;
  nightsSold: number;
  /** netRevenue per night sold. */
  adr: number;
  /** netRevenue per available night (bookable properties × days in range). */
  revpar: number;
}

interface BookingRevenue {
  propertyId: string;
  nights: number;
  gross: number;
  refunds: number;
  hostEarnings: number;
}

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'completed'];
// Refunded and partially refunded payments were captured first; their refunds are subtracted below.
export const CAPTURED_PAYMENT_STATUSES: PaymentStatus[] = ['succeeded', 'partially_refunded', 'refunded'];
// The refund states issuePaymentRefund() treats as money already returned (not pending/failed).
const RETURNED_REFUND_STATUSES = ['refunded', 'pending_manual'];
const DEFAULT_PLATFORM_FEE_PERCENT = 15;
const DAY_MS = 86_400_000;

const round2 = (value: number) => Math.round(value * 100) / 100;

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Host payout for a booking, scaled by the share of the charge that was not refunded. */
function hostEarningsFor(feesBreakdown: unknown, gross: number, refunds: number): number {
  if (gross <= 0) return 0;
  const fees = (feesBreakdown && typeof feesBreakdown === 'object' ? feesBreakdown : {}) as Record<
    string,
    unknown
  >;
  const feePercent = finiteNumber(fees.platform_fee_percent) ?? DEFAULT_PLATFORM_FEE_PERCENT;
  const base = finiteNumber(fees.base_amount) ?? gross / (1 + feePercent / 100);
  const receives = finiteNumber(fees.host_receives) ?? base * (1 - feePercent / 100);
  return receives * Math.max(0, 1 - refunds / gross);
}

export class RevenueAnalyticsEngine {
  /** Active bookings created inside the range, with their captured payments net of refunds. */
  private static async collect(filters: RevenueFilters): Promise<BookingRevenue[]> {
    const { range, propertyIds, hostIds } = filters;

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_BOOKING_STATUSES },
        createdAt: { gte: range.startAt, lt: range.endAtExclusive },
        ...(propertyIds?.length ? { propertyId: { in: propertyIds } } : {}),
        ...(hostIds?.length ? { property: { hostId: { in: hostIds } } } : {}),
      },
      select: {
        propertyId: true,
        checkIn: true,
        checkOut: true,
        feesBreakdown: true,
        payments: {
          where: { status: { in: CAPTURED_PAYMENT_STATUSES } },
          select: {
            amount: true,
            refunds: { where: { status: { in: RETURNED_REFUND_STATUSES } }, select: { amountMinor: true } },
          },
        },
      },
    });

    return bookings.map((booking) => {
      let gross = 0;
      let refunds = 0;
      for (const payment of booking.payments) {
        gross += Number(payment.amount);
        for (const refund of payment.refunds) refunds += refund.amountMinor / 100;
      }
      const nights = Math.max(0, Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / DAY_MS));
      return {
        propertyId: booking.propertyId,
        nights,
        gross,
        refunds,
        hostEarnings: hostEarningsFor(booking.feesBreakdown, gross, refunds),
      };
    });
  }

  private static summarize(rows: BookingRevenue[], availableNights: number): RevenueMetrics {
    let grossRevenue = 0;
    let refundsTotal = 0;
    let hostEarnings = 0;
    let nightsSold = 0;

    for (const row of rows) {
      grossRevenue += row.gross;
      refundsTotal += row.refunds;
      hostEarnings += row.hostEarnings;
      nightsSold += row.nights;
    }

    const netRevenue = grossRevenue - refundsTotal;
    return {
      grossRevenue: round2(grossRevenue),
      netRevenue: round2(netRevenue),
      refundsTotal: round2(refundsTotal),
      hostEarnings: round2(hostEarnings),
      bookingsCount: rows.length,
      nightsSold,
      adr: nightsSold > 0 ? round2(netRevenue / nightsSold) : 0,
      revpar: availableNights > 0 ? round2(netRevenue / availableNights) : 0,
    };
  }

  static async calculate(filters: RevenueFilters): Promise<RevenueMetrics> {
    const [rows, propertiesCount] = await Promise.all([
      this.collect(filters),
      prisma.property.count({ where: bookablePropertyWhere(filters) }),
    ]);
    return this.summarize(rows, propertiesCount * filters.range.days);
  }

  /** One query for many properties; every requested id gets an entry (zeros when it has no bookings). */
  static async byProperty(
    filters: RevenueFilters & { propertyIds: string[] },
  ): Promise<Map<string, RevenueMetrics>> {
    const rows = await this.collect(filters);
    const grouped = new Map<string, BookingRevenue[]>();
    for (const row of rows) {
      const list = grouped.get(row.propertyId);
      if (list) list.push(row);
      else grouped.set(row.propertyId, [row]);
    }

    const result = new Map<string, RevenueMetrics>();
    for (const id of filters.propertyIds) {
      result.set(id, this.summarize(grouped.get(id) ?? [], filters.range.days));
    }
    return result;
  }

  static async forProperty(propertyId: string, filters: Omit<RevenueFilters, 'propertyIds'>) {
    return this.calculate({ ...filters, propertyIds: [propertyId] });
  }

  static async forHost(hostId: string, filters: Omit<RevenueFilters, 'hostIds'>) {
    return this.calculate({ ...filters, hostIds: [hostId] });
  }
}
