/**
 * Occupancy Analytics Engine - REV-2
 */
import { prisma } from '../prisma.js';

export interface OccupancyFilters {
  startDate?: Date;
  endDate?: Date;
  propertyIds?: string[];
  hostIds?: string[];
}

export interface OccupancyMetrics {
  occupancyRate: number;
  nightsBooked: number;
  nightsAvailable: number;
  nightsBlocked: number;
  propertiesCount: number;
}

export class OccupancyAnalyticsEngine {
  static async calculate(filters: OccupancyFilters = {}): Promise<OccupancyMetrics> {
    const { startDate, endDate, propertyIds, hostIds } = filters;
    
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate || new Date();
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    
    const propertyWhere: any = {};
    if (propertyIds?.length) {
      propertyWhere.id = { in: propertyIds };
    }

    const properties = await prisma.property.findMany({
      where: propertyWhere,
      select: { id: true, hostId: true, status: true },
    });

    let filteredProperties = properties;
    if (hostIds?.length) {
      filteredProperties = properties.filter((p: any) => hostIds.includes(p.hostId));
    }

    let totalNightsBooked = 0;
    let totalNightsAvailable = 0;
    let totalNightsBlocked = 0;

    for (const property of filteredProperties) {
      const nightsAvailable = daysDiff;
      
      const bookings = await prisma.booking.findMany({
        where: {
          propertyId: property.id,
          status: { in: ['confirmed', 'checked_in', 'completed'] },
          OR: [
            { checkIn: { gte: start, lte: end } },
            { checkOut: { gte: start, lte: end } },
            { checkIn: { lte: start }, checkOut: { gte: end } },
          ],
        },
      });

      let nightsBooked = 0;
      for (const booking of bookings) {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        const overlapStart = checkIn > start ? checkIn : start;
        const overlapEnd = checkOut < end ? checkOut : end;
        
        if (overlapEnd > overlapStart) {
          const overlapNights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000);
          nightsBooked += overlapNights;
        }
      }

      const blocks = await prisma.availabilityBlock.findMany({
        where: {
          propertyId: property.id,
          startDate: { lte: end },
          endDate: { gte: start },
        },
      });

      let nightsBlocked = 0;
      for (const block of blocks) {
        const blockStart = new Date(block.startDate);
        const blockEnd = new Date(block.endDate);
        
        const overlapStart = blockStart > start ? blockStart : start;
        const overlapEnd = blockEnd < end ? blockEnd : end;
        
        if (overlapEnd > overlapStart) {
          const overlapNights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000);
          nightsBlocked += overlapNights;
        }
      }

      totalNightsBooked += nightsBooked;
      totalNightsAvailable += nightsAvailable;
      totalNightsBlocked += nightsBlocked;
    }

    const occupancyRate = totalNightsAvailable > 0 ? (totalNightsBooked / totalNightsAvailable) * 100 : 0;

    return {
      occupancyRate,
      nightsBooked: totalNightsBooked,
      nightsAvailable: totalNightsAvailable,
      nightsBlocked: totalNightsBlocked,
      propertiesCount: filteredProperties.length,
    };
  }

  static async forProperty(propertyId: string, filters: Omit<OccupancyFilters, 'propertyIds'> = {}) {
    return this.calculate({ ...filters, propertyIds: [propertyId] });
  }

  static async forHost(hostId: string, filters: Omit<OccupancyFilters, 'hostIds'> = {}) {
    return this.calculate({ ...filters, hostIds: [hostId] });
  }
}
