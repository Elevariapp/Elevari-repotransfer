/**
 * Attribution Engine - REV-5
 * 
 * NOTE: Schema validation shows Booking model does not have UTM fields.
 * Attribution is based on available data and BookingEvent metadata.
 * For full UTM tracking, schema needs to be extended with utmSource, utmMedium, utmCampaign fields.
 */
import { prisma } from '../prisma.js';

export interface AttributionFilters {
  startDate?: Date;
  endDate?: Date;
  propertyIds?: string[];
  hostIds?: string[];
}

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
  static async calculate(filters: AttributionFilters = {}): Promise<AttributionMetrics> {
    const { startDate, endDate, propertyIds, hostIds } = filters;
    
    const bookingWhere: any = {
      status: { in: ['confirmed', 'checked_in', 'completed'] },
    };

    if (startDate || endDate) {
      bookingWhere.createdAt = {};
      if (startDate) bookingWhere.createdAt.gte = startDate;
      if (endDate) bookingWhere.createdAt.lte = endDate;
    }

    if (propertyIds?.length) {
      bookingWhere.propertyId = { in: propertyIds };
    }

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        property: { select: { id: true, hostId: true } },
        payments: { where: { status: 'succeeded' } },
        events: { where: { toStatus: 'confirmed' }, take: 1 },
      },
    });

    let filteredBookings = bookings;
    if (hostIds?.length) {
      filteredBookings = bookings.filter((b: any) => hostIds.includes(b.property.hostId));
    }

    const channelMap = new Map<string, ChannelMetrics>();
    const sourceMap = new Map<string, SourceMetrics>();

    let totalRevenue = 0;
    let totalBookings = 0;

    for (const booking of filteredBookings) {
      const revenue = booking.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
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

  static async forProperty(propertyId: string, filters: Omit<AttributionFilters, 'propertyIds'> = {}) {
    return this.calculate({ ...filters, propertyIds: [propertyId] });
  }

  static async forHost(hostId: string, filters: Omit<AttributionFilters, 'hostIds'> = {}) {
    return this.calculate({ ...filters, hostIds: [hostId] });
  }
}
