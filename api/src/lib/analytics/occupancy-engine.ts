/**
 * Occupancy Analytics Engine - REV-5
 */
import { prisma } from '../prisma.js';
import { ACTIVE_BOOKING_STATUSES } from './revenue-engine.js';
import { bookablePropertyWhere, overlapNights, type ScopeFilters } from './range.js';

export type OccupancyFilters = ScopeFilters;

export interface OccupancyMetrics {
  occupancyRate: number;
  nightsBooked: number;
  /** Bookable properties × days in range (blocked nights are not subtracted). */
  nightsAvailable: number;
  /** Nights closed by the host or imported from other channels (Elevari bookings excluded). */
  nightsBlocked: number;
  propertiesCount: number;
}

interface PropertyNights {
  booked: number;
  blocked: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export class OccupancyAnalyticsEngine {
  /** Nights booked/blocked per bookable property, using one query per table whatever the property count. */
  private static async collect(filters: OccupancyFilters): Promise<Map<string, PropertyNights>> {
    const { range } = filters;

    const properties = await prisma.property.findMany({
      where: bookablePropertyWhere(filters),
      select: { id: true },
    });
    const nights = new Map<string, PropertyNights>(
      properties.map((property) => [property.id, { booked: 0, blocked: 0 }]),
    );
    if (nights.size === 0) return nights;

    const propertyIds = [...nights.keys()];
    const [bookings, blocks] = await Promise.all([
      prisma.booking.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ACTIVE_BOOKING_STATUSES },
          checkIn: { lt: range.endDayExclusive },
          checkOut: { gt: range.startDay },
        },
        select: { propertyId: true, checkIn: true, checkOut: true },
      }),
      prisma.availabilityBlock.findMany({
        where: {
          propertyId: { in: propertyIds },
          source: { not: 'booking' },
          startDate: { lt: range.endDayExclusive },
          endDate: { gt: range.startDay },
        },
        select: { propertyId: true, startDate: true, endDate: true },
      }),
    ]);

    for (const booking of bookings) {
      const entry = nights.get(booking.propertyId);
      if (entry) entry.booked += overlapNights(range, booking.checkIn, booking.checkOut);
    }
    for (const block of blocks) {
      const entry = nights.get(block.propertyId);
      if (entry) entry.blocked += overlapNights(range, block.startDate, block.endDate);
    }

    // Overlapping imports/bookings must never push a property above 100% of its nights.
    for (const entry of nights.values()) {
      entry.booked = Math.min(entry.booked, range.days);
      entry.blocked = Math.min(entry.blocked, range.days);
    }
    return nights;
  }

  private static summarize(entries: PropertyNights[], days: number): OccupancyMetrics {
    let nightsBooked = 0;
    let nightsBlocked = 0;
    for (const entry of entries) {
      nightsBooked += entry.booked;
      nightsBlocked += entry.blocked;
    }
    const nightsAvailable = entries.length * days;

    return {
      occupancyRate: nightsAvailable > 0 ? round2((nightsBooked / nightsAvailable) * 100) : 0,
      nightsBooked,
      nightsAvailable,
      nightsBlocked,
      propertiesCount: entries.length,
    };
  }

  static async calculate(filters: OccupancyFilters): Promise<OccupancyMetrics> {
    const nights = await this.collect(filters);
    return this.summarize([...nights.values()], filters.range.days);
  }

  /** Per-property occupancy; ids that are not bookable (drafts, unknown) get zeros. */
  static async byProperty(
    filters: OccupancyFilters & { propertyIds: string[] },
  ): Promise<Map<string, OccupancyMetrics>> {
    const nights = await this.collect(filters);
    const result = new Map<string, OccupancyMetrics>();
    for (const id of filters.propertyIds) {
      const entry = nights.get(id);
      result.set(id, this.summarize(entry ? [entry] : [], filters.range.days));
    }
    return result;
  }

  static async forProperty(propertyId: string, filters: Omit<OccupancyFilters, 'propertyIds'>) {
    return this.calculate({ ...filters, propertyIds: [propertyId] });
  }

  static async forHost(hostId: string, filters: Omit<OccupancyFilters, 'hostIds'>) {
    return this.calculate({ ...filters, hostIds: [hostId] });
  }
}
