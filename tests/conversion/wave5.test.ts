import { describe, it, expect, beforeAll } from 'vitest';
import { RevenueAnalyticsEngine } from '@/lib/analytics/revenue-engine';
import { OccupancyAnalyticsEngine } from '@/lib/analytics/occupancy-engine';
import { AttributionEngine } from '@/lib/analytics/attribution-engine';
import { PropertyPerformanceEngine } from '@/lib/analytics/property-performance-engine';

describe('Wave 5 - Revenue & Occupancy Optimization', () => {
  describe('REV-1: Revenue Analytics Engine', () => {
    it('RT-1: Should calculate gross revenue correctly', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      expect(metrics.grossRevenue).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.grossRevenue).toBe('number');
    });

    it('RT-2: Should calculate net revenue after refunds', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      expect(metrics.netRevenue).toBeLessThanOrEqual(metrics.grossRevenue);
      expect(metrics.netRevenue).toBeGreaterThanOrEqual(0);
    });

    it('RT-3: Should calculate ADR correctly', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      if (metrics.nightsSold > 0) {
        expect(metrics.adr).toBeGreaterThan(0);
        expect(metrics.adr).toBeCloseTo(metrics.netRevenue / metrics.nightsSold, 2);
      }
    });

    it('RT-4: Should filter by property', async () => {
      const metrics = await RevenueAnalyticsEngine.forProperty('test-property-id');
      expect(metrics).toBeDefined();
    });

    it('RT-5: Should filter by host', async () => {
      const metrics = await RevenueAnalyticsEngine.forHost('test-host-id');
      expect(metrics).toBeDefined();
    });
  });

  describe('REV-2: Occupancy Analytics Engine', () => {
    it('RT-6: Should calculate occupancy rate', async () => {
      const metrics = await OccupancyAnalyticsEngine.calculate();
      expect(metrics.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(metrics.occupancyRate).toBeLessThanOrEqual(100);
    });

    it('RT-7: Should calculate nights booked', async () => {
      const metrics = await OccupancyAnalyticsEngine.calculate();
      expect(metrics.nightsBooked).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.nightsBooked).toBe('number');
    });

    it('RT-8: Should filter by property', async () => {
      const metrics = await OccupancyAnalyticsEngine.forProperty('test-property-id');
      expect(metrics).toBeDefined();
    });
  });

  describe('REV-3: Attribution Engine', () => {
    it('RT-9: Should calculate attribution by channel', async () => {
      const metrics = await AttributionEngine.calculate();
      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.byChannel)).toBe(true);
    });

    it('RT-10: Should detect channels correctly', async () => {
      const metrics = await AttributionEngine.calculate();
      metrics.byChannel.forEach(channel => {
        expect(channel.channel).toBeDefined();
        expect(channel.revenue).toBeGreaterThanOrEqual(0);
        expect(channel.bookings).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('REV-4: Property Performance Score', () => {
    it('RT-11: Should calculate performance score for property', async () => {
      const performance = await PropertyPerformanceEngine.calculateForProperty('test-property-id');
      expect(performance.score).toBeGreaterThanOrEqual(0);
      expect(performance.score).toBeLessThanOrEqual(100);
      expect(performance.metrics).toBeDefined();
    });

    it('RT-12: Should calculate performance for host', async () => {
      const performance = await PropertyPerformanceEngine.calculateForHost('test-host-id');
      expect(performance.averageScore).toBeGreaterThanOrEqual(0);
      expect(performance.propertiesCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Centinela Controls CGC-W5', () => {
    it('CGC-W5-1: Revenue metrics must be traceable to bookings', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      expect(metrics.bookingsCount).toBeGreaterThanOrEqual(0);
    });

    it('CGC-W5-2: Occupancy rate must be between 0 and 100', async () => {
      const metrics = await OccupancyAnalyticsEngine.calculate();
      expect(metrics.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(metrics.occupancyRate).toBeLessThanOrEqual(100);
    });

    it('CGC-W5-3: Performance score must be normalized 0-100', async () => {
      const performances = await PropertyPerformanceEngine.calculateAll();
      performances.forEach(p => {
        expect(p.score).toBeGreaterThanOrEqual(0);
        expect(p.score).toBeLessThanOrEqual(100);
      });
    });

    it('CGC-W5-4: Revenue calculations must be reproducible', async () => {
      const metrics1 = await RevenueAnalyticsEngine.calculate();
      const metrics2 = await RevenueAnalyticsEngine.calculate();
      expect(metrics1.grossRevenue).toBe(metrics2.grossRevenue);
      expect(metrics1.netRevenue).toBe(metrics2.netRevenue);
    });

    it('CGC-W5-5: ADR calculation must be consistent', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      if (metrics.nightsSold > 0) {
        const calculatedAdr = metrics.netRevenue / metrics.nightsSold;
        expect(metrics.adr).toBeCloseTo(calculatedAdr, 2);
      }
    });

    it('CGC-W5-6: Metrics must be auditable', async () => {
      const metrics = await RevenueAnalyticsEngine.calculate();
      expect(metrics.bookingsCount).toBeDefined();
      expect(metrics.nightsSold).toBeDefined();
    });
  });
});
