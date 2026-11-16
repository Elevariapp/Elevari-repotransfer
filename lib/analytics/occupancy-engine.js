"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccupancyAnalyticsEngine = void 0;
/**
 * Occupancy Analytics Engine - REV-2
 */
const prisma_1 = require("@/api/src/lib/prisma");
class OccupancyAnalyticsEngine {
    static async calculate(filters = {}) {
        const { startDate, endDate, propertyIds, hostIds } = filters;
        const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate || new Date();
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
        const propertyWhere = {};
        if (propertyIds?.length) {
            propertyWhere.id = { in: propertyIds };
        }
        const properties = await prisma_1.prisma.property.findMany({
            where: propertyWhere,
            select: { id: true, hostId: true, status: true },
        });
        let filteredProperties = properties;
        if (hostIds?.length) {
            filteredProperties = properties.filter((p) => hostIds.includes(p.hostId));
        }
        let totalNightsBooked = 0;
        let totalNightsAvailable = 0;
        let totalNightsBlocked = 0;
        for (const property of filteredProperties) {
            const nightsAvailable = daysDiff;
            const bookings = await prisma_1.prisma.booking.findMany({
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
            const blocks = await prisma_1.prisma.availabilityBlock.findMany({
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
    static async forProperty(propertyId, filters = {}) {
        return this.calculate({ ...filters, propertyIds: [propertyId] });
    }
    static async forHost(hostId, filters = {}) {
        return this.calculate({ ...filters, hostIds: [hostId] });
    }
}
exports.OccupancyAnalyticsEngine = OccupancyAnalyticsEngine;
