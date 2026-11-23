/**
 * Attribution Engine - REV-5
 * 
 * NOTE: Schema validation shows Booking model does not have UTM fields.
 * Attribution is based on available data and BookingEvent metadata.
 * For full UTM tracking, schema needs to be extended with utmSource, utmMedium, utmCampaign fields.
 */
import { prisma } from '../prisma.js';
import { ACTIVE_BOOKING_STATUSES, CAPTURED_PAYMENT_STATUSES } from './revenue-engine.js';
import type { ScopeFilters } from './range.js';

export type AttributionFilters = ScopeFilters;

export interface AttributionMetrics {
  totalRevenue: number;
  totalBookings: number;
  byChannel: ChannelMetrics[];
  bySource: SourceMetrics[];
}

export interface ChannelMetrics {
  channel: string;
  revenue: number;
  bookings: number;
  conversionRate: number;
}

export interface SourceMetrics {
  source: string;
  revenue: number;
  bookings: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export class AttributionEngine {
  static async calculate(filters: AttributionFilters): Promise<AttributionMetrics> {
    const { range, propertyIds, hostIds } = filters;

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_BOOKING_STATUSES },
        createdAt: { gte: range.startAt, lt: range.endAtExclusive },
        ...(propertyIds?.length ? { propertyId: { in: propertyIds } } : {}),
        ...(hostIds?.length ? { property: { hostId: { in: hostIds } } } : {}),
      },
      select: {
        payments: {
          where: { status: { in: CAPTURED_PAYMENT_STATUSES } },
          select: {
            amount: true,
            refunds: { where: { status: { in: ['refunded', 'pending_manual'] } }, select: { amountMinor: true } },
          },
        },
        events: { where: { toStatus: 'confirmed' }, take: 1, select: { metadata: true } },
      },
    });

    const channelMap = new Map<string, ChannelMetrics>();
    const sourceMap = new Map<string, SourceMetrics>();

    let totalRevenue = 0;
    let totalBookings = 0;

    for (const booking of bookings) {
      // Net of refunds, like the revenue engine.
      const revenue = booking.payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount) -
          payment.refunds.reduce((refunded, refund) => refunded + refund.amountMinor / 100, 0),
        0,
      );
      totalRevenue += revenue;
      totalBookings++;

      const channel = this.detectChannel(booking);
      const source = this.detectSource(booking);

      if (!channelMap.has(channel)) {
        channelMap.set(channel, { channel, revenue: 0, bookings: 0, conversionRate: 0 });
      }
      const channelMetric = channelMap.get(channel)!;
      channelMetric.revenue += revenue;
      channelMetric.bookings++;

      if (!sourceMap.has(source)) {
        sourceMap.set(source, { source, revenue: 0, bookings: 0 });
      }
      const sourceMetric = sourceMap.get(source)!;
      sourceMetric.revenue += revenue;
      sourceMetric.bookings++;
    }

    const byChannel = Array.from(channelMap.values()).map(c => ({
      ...c,
      conversionRate: c.bookings > 0 ? (c.revenue / c.bookings) : 0,
    }));

    const bySource = Array.from(sourceMap.values());

    return {
      totalRevenue,
      totalBookings,
      byChannel,
      bySource,
    };
  }

  private static detectChannel(booking: any): string {
    // Schema validation: Booking model has no userAgent/referer fields
    // Attribution based on available data - default to direct
    // For full attribution, extend schema with tracking fields
    return 'direct';
  }

  private static detectSource(booking: any): string {
    // Schema validation: Booking model has no UTM fields
    // Check BookingEvent metadata for tracking info
    const event = booking.events?.[0];
    if (event?.metadata) {
      const meta = event.metadata as any;
      const utmSource = meta.utmSource || meta.utm_source || 'direct';
      const utmMedium = meta.utmMedium || meta.utm_medium || 'none';
      return `${utmSource}_${utmMedium}`;
    }
    return 'direct_none';
  }

  static async forProperty(propertyId: string, filters: Omit<AttributionFilters, 'propertyIds'>) {
    return this.calculate({ ...filters, propertyIds: [propertyId] });
  }

  static async forHost(hostId: string, filters: Omit<AttributionFilters, 'hostIds'>) {
    return this.calculate({ ...filters, hostIds: [hostId] });
  }
}
