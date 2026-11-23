/**
 * Property Performance Score Engine - REV-5
 * 
 * NOTE: Schema validation shows no Message model exists.
 * Response time metric is disabled until messaging schema is added.
 */
import { prisma } from '../prisma.js';
import { RevenueAnalyticsEngine, type RevenueMetrics } from './revenue-engine.js';
import { OccupancyAnalyticsEngine, type OccupancyMetrics } from './occupancy-engine.js';
import type { AnalyticsRange } from './range.js';

export interface PerformanceFilters {
  range: AnalyticsRange;
}

export interface PropertyPerformance {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyStatus: string;
  score: number;
  metrics: {
    occupancyRate: number;
    revpar: number;
    adr: number;
    reviewScore: number;
    reviewCount: number;
    responseTime: number;
    bookingsCount: number;
    nightsSold: number;
    nightsBooked: number;
    netRevenue: number;
    hostEarnings: number;
  };
  normalized: {
    occupancy: number;
    revpar: number;
    review: number;
    response: number;
  };
}

export interface HostPerformance {
  hostId: string;
  hostEmail: string;
  /** null when the host has no published property to rate. */
  averageScore: number | null;
  /** Properties that can take bookings (everything except drafts). */
  propertiesCount: number;
  /** Properties still waiting for the review that publishes them. */
  draftPropertiesCount: number;
  properties: PropertyPerformance[];
}

interface PropertyRow {
  id: string;
  slug: string;
  title: string;
  status: string;
}

// RevPAR (COP per available night) that earns the full revenue score.
const REVPAR_TARGET_COP = 250_000;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class PropertyPerformanceEngine {
  /** Scores many properties with a fixed number of queries (no per-property round trips). */
  private static async build(properties: PropertyRow[], range: AnalyticsRange): Promise<PropertyPerformance[]> {
    if (properties.length === 0) return [];
    const propertyIds = properties.map((property) => property.id);

    const [revenue, occupancy, reviews] = await Promise.all([
      RevenueAnalyticsEngine.byProperty({ range, propertyIds }),
      OccupancyAnalyticsEngine.byProperty({ range, propertyIds }),
      prisma.review.groupBy({
        by: ['propertyId'],
        where: { propertyId: { in: propertyIds }, isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    const reviewByProperty = new Map(reviews.map((row) => [row.propertyId, row]));

    return properties.map((property) => {
      const revenueMetrics = revenue.get(property.id) as RevenueMetrics;
      const occupancyMetrics = occupancy.get(property.id) as OccupancyMetrics;
      const review = reviewByProperty.get(property.id);
      const reviewCount = review?._count._all ?? 0;
      const reviewScore = reviewCount > 0 ? Number(review?._avg.rating ?? 0) : 0;
      // Schema validation: No Message model exists, response time disabled
      const responseTime = 0;

      const normalized = {
        occupancy: round2(this.normalize(occupancyMetrics.occupancyRate, 0, 100)),
        revpar: round2(this.normalize(revenueMetrics.revpar, 0, REVPAR_TARGET_COP)),
        review: round2(this.normalize(reviewScore, 0, 5)),
        response: 100, // Default when no messaging data
      };

      // Without reviews the weight is shared by the other two metrics instead of counting as a zero.
      const score =
        reviewCount > 0
          ? 0.4 * normalized.occupancy + 0.4 * normalized.revpar + 0.2 * normalized.review
          : (0.4 * normalized.occupancy + 0.4 * normalized.revpar) / 0.8;

      return {
        propertyId: property.id,
        propertySlug: property.slug,
        propertyTitle: property.title,
        propertyStatus: property.status,
        score: round2(score),
        metrics: {
          occupancyRate: occupancyMetrics.occupancyRate,
          revpar: revenueMetrics.revpar,
          adr: revenueMetrics.adr,
          reviewScore: round2(reviewScore),
          reviewCount,
          responseTime,
          bookingsCount: revenueMetrics.bookingsCount,
          nightsSold: revenueMetrics.nightsSold,
          nightsBooked: occupancyMetrics.nightsBooked,
          netRevenue: revenueMetrics.netRevenue,
          hostEarnings: revenueMetrics.hostEarnings,
        },
        normalized,
      };
    });
  }

  static async calculateForProperty(propertyId: string, filters: PerformanceFilters): Promise<PropertyPerformance> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, slug: true, title: true, status: true },
    });

    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const [performance] = await this.build([property], filters.range);
    return performance;
  }

  static async calculateForHost(hostId: string, filters: PerformanceFilters): Promise<HostPerformance> {
    const [host, properties, draftPropertiesCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: hostId }, select: { email: true } }),
      prisma.property.findMany({
        where: { hostId, status: { not: 'draft' } },
        select: { id: true, slug: true, title: true, status: true },
      }),
      prisma.property.count({ where: { hostId, status: 'draft' } }),
    ]);

    const performances = (await this.build(properties, filters.range)).sort((a, b) => b.score - a.score);
    const averageScore =
      performances.length > 0
        ? performances.reduce((sum, performance) => sum + performance.score, 0) / performances.length
        : null;

    return {
      hostId,
      hostEmail: host?.email || '',
      averageScore: averageScore === null ? null : round2(averageScore),
      propertiesCount: properties.length,
      draftPropertiesCount,
      properties: performances,
    };
  }

  static async calculateAll(filters: PerformanceFilters): Promise<PropertyPerformance[]> {
    const properties = await prisma.property.findMany({
      where: { status: { not: 'draft' } },
      select: { id: true, slug: true, title: true, status: true },
    });

    return (await this.build(properties, filters.range)).sort((a, b) => b.score - a.score);
  }

  private static normalize(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  }
}
