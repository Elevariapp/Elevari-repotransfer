/**
 * Property Performance Score Engine - REV-5
 * 
 * NOTE: Schema validation shows no Message model exists.
 * Response time metric is disabled until messaging schema is added.
 */
import { prisma } from '../prisma.js';
import { RevenueAnalyticsEngine } from './revenue-engine.js';
import { OccupancyAnalyticsEngine } from './occupancy-engine.js';

export interface PerformanceFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface PropertyPerformance {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  score: number;
  metrics: {
    occupancyRate: number;
    revpar: number;
    adr: number;
    reviewScore: number;
    responseTime: number;
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
  averageScore: number;
  propertiesCount: number;
  properties: PropertyPerformance[];
}

export class PropertyPerformanceEngine {
  static async calculateForProperty(propertyId: string, filters: PerformanceFilters = {}): Promise<PropertyPerformance> {
    const revenue = await RevenueAnalyticsEngine.forProperty(propertyId, filters);
    const occupancy = await OccupancyAnalyticsEngine.forProperty(propertyId, filters);

    const property = await prisma.property.findUnique({
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

    const score = 
      0.40 * normalized.occupancy +
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

  static async calculateForHost(hostId: string, filters: PerformanceFilters = {}): Promise<HostPerformance> {
    const properties = await prisma.property.findMany({
      where: { hostId },
      select: { id: true, slug: true, title: true },
    });

    const performances = await Promise.all(
      properties.map((p: any) => this.calculateForProperty(p.id, filters))
    );

    const averageScore = performances.reduce((sum: number, p: any) => sum + p.score, 0) / performances.length;

    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, email: true },
    });

    return {
      hostId,
      hostEmail: host?.email || '',
      averageScore: Math.round(averageScore * 100) / 100,
      propertiesCount: properties.length,
      properties: performances.sort((a: any, b: any) => b.score - a.score),
    };
  }

  static async calculateAll(filters: PerformanceFilters = {}): Promise<PropertyPerformance[]> {
    const properties = await prisma.property.findMany({
      select: { id: true },
    });

    const performances = await Promise.all(
      properties.map((p: any) => this.calculateForProperty(p.id, filters))
    );

    return performances.sort((a: any, b: any) => b.score - a.score);
  }

  private static async getReviewScore(propertyId: string): Promise<number> {
    const reviews = await prisma.review.findMany({
      where: { propertyId },
      select: { rating: true },
    });

    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    return sum / reviews.length;
  }

  private static normalize(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  }
}
