"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyPerformanceEngine = void 0;
/**
 * Property Performance Score Engine - REV-4
 *
 * NOTE: Schema validation shows no Message model exists.
 * Response time metric is disabled until messaging schema is added.
 */
const prisma_1 = require("@/api/src/lib/prisma");
const revenue_engine_1 = require("./revenue-engine");
const occupancy_engine_1 = require("./occupancy-engine");
class PropertyPerformanceEngine {
    static async calculateForProperty(propertyId, filters = {}) {
        const revenue = await revenue_engine_1.RevenueAnalyticsEngine.forProperty(propertyId, filters);
        const occupancy = await occupancy_engine_1.OccupancyAnalyticsEngine.forProperty(propertyId, filters);
        const property = await prisma_1.prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true, slug: true, title: true },
        });
        if (!property) {
            throw new Error(`Property ${propertyId} not found`);
        }
        const reviewScore = await this.getReviewScore(propertyId);
        // Schema validation: No Message model exists, response time disabled
        const responseTime = 0;
        const metrics = {
            occupancyRate: occupancy.occupancyRate,
            revpar: revenue.revpar,
            adr: revenue.adr,
            reviewScore,
            responseTime,
        };
        const normalized = {
            occupancy: this.normalize(metrics.occupancyRate, 0, 100),
            revpar: this.normalize(metrics.revpar, 0, 500),
            review: this.normalize(metrics.reviewScore, 0, 5),
            response: 100, // Default when no messaging data
        };
        const score = 0.40 * normalized.occupancy +
            0.40 * normalized.revpar +
            0.20 * normalized.review;
        return {
            propertyId,
            propertySlug: property.slug,
            propertyTitle: property.title,
            score: Math.round(score * 100) / 100,
            metrics,
            normalized,
        };
    }
    static async calculateForHost(hostId, filters = {}) {
        const properties = await prisma_1.prisma.property.findMany({
            where: { hostId },
            select: { id: true, slug: true, title: true },
        });
        const performances = await Promise.all(properties.map((p) => this.calculateForProperty(p.id, filters)));
        const averageScore = performances.reduce((sum, p) => sum + p.score, 0) / performances.length;
        const host = await prisma_1.prisma.user.findUnique({
            where: { id: hostId },
            select: { id: true, email: true },
        });
        return {
            hostId,
            hostEmail: host?.email || '',
            averageScore: Math.round(averageScore * 100) / 100,
            propertiesCount: properties.length,
            properties: performances.sort((a, b) => b.score - a.score),
        };
    }
    static async calculateAll(filters = {}) {
        const properties = await prisma_1.prisma.property.findMany({
            select: { id: true },
        });
        const performances = await Promise.all(properties.map((p) => this.calculateForProperty(p.id, filters)));
        return performances.sort((a, b) => b.score - a.score);
    }
    static async getReviewScore(propertyId) {
        const reviews = await prisma_1.prisma.review.findMany({
            where: { propertyId },
            select: { rating: true },
        });
        if (reviews.length === 0)
            return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / reviews.length;
    }
    static normalize(value, min, max) {
        if (value <= min)
            return 0;
        if (value >= max)
            return 100;
        return ((value - min) / (max - min)) * 100;
    }
}
exports.PropertyPerformanceEngine = PropertyPerformanceEngine;
