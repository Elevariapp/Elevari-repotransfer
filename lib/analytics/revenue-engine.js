"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueAnalyticsEngine = void 0;
/**
 * Revenue Analytics Engine - REV-1
 */
const prisma_1 = require("@/api/src/lib/prisma");
class RevenueAnalyticsEngine {
    static async calculate(filters = {}) {
        const { startDate, endDate, propertyIds, hostIds } = filters;
        const bookingWhere = {
            status: { in: ['confirmed', 'checked_in', 'completed'] },
        };
        if (startDate || endDate) {
            bookingWhere.createdAt = {};
            if (startDate)
                bookingWhere.createdAt.gte = startDate;
            if (endDate)
                bookingWhere.createdAt.lte = endDate;
        }
        if (propertyIds?.length) {
            bookingWhere.propertyId = { in: propertyIds };
        }
        const bookings = await prisma_1.prisma.booking.findMany({
            where: bookingWhere,
            include: {
                property: { select: { id: true, hostId: true } },
                payments: { where: { status: 'succeeded' }, include: { refunds: true } },
            },
        });
        let filteredBookings = bookings;
        if (hostIds?.length) {
            filteredBookings = bookings.filter((b) => hostIds.includes(b.property.hostId));
        }
        let grossRevenue = 0;
        let refundsTotal = 0;
        let nightsSold = 0;
        let bookingsCount = 0;
        for (const booking of filteredBookings) {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
            nightsSold += nights;
            bookingsCount++;
            for (const payment of booking.payments) {
                const paymentAmount = Number(payment.amount);
                grossRevenue += paymentAmount;
                const paymentRefunds = payment.refunds || [];
                for (const refund of paymentRefunds) {
                    refundsTotal += refund.amountMinor / 100;
                }
            }
        }
        const netRevenue = grossRevenue - refundsTotal;
        const adr = nightsSold > 0 ? netRevenue / nightsSold : 0;
        const revpar = adr;
        return {
            grossRevenue,
            netRevenue,
            refundsTotal,
            bookingsCount,
            nightsSold,
            adr,
            revpar,
        };
    }
    static async forProperty(propertyId, filters = {}) {
        return this.calculate({ ...filters, propertyIds: [propertyId] });
    }
    static async forHost(hostId, filters = {}) {
        return this.calculate({ ...filters, hostIds: [hostId] });
    }
}
exports.RevenueAnalyticsEngine = RevenueAnalyticsEngine;
