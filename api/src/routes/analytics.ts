import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRoles } from '../plugins/auth.js';
import { RevenueAnalyticsEngine } from '../lib/analytics/revenue-engine.js';
import { OccupancyAnalyticsEngine } from '../lib/analytics/occupancy-engine.js';
import { AttributionEngine } from '../lib/analytics/attribution-engine.js';
import { PropertyPerformanceEngine } from '../lib/analytics/property-performance-engine.js';

const dateSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  property_ids: z.array(z.string()).optional(),
  host_ids: z.array(z.string()).optional(),
});

export async function analyticsRoutes(app: FastifyInstance) {
  app.get(
    '/analytics/revenue',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const body = dateSchema.safeParse(request.query);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid query' });
      }

      const filters = {
        startDate: body.data.start_date ? new Date(body.data.start_date) : undefined,
        endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
        propertyIds: body.data.property_ids,
        hostIds: body.data.host_ids,
      };

      const userId = request.auth!.sub;
      const role = request.auth!.role;

      if (role === 'host') {
        filters.hostIds = [userId];
      }

      const metrics = await RevenueAnalyticsEngine.calculate(filters);
      return reply.send({ data: metrics });
    }
  );

  app.get(
    '/analytics/occupancy',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const body = dateSchema.safeParse(request.query);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid query' });
      }

      const filters = {
        startDate: body.data.start_date ? new Date(body.data.start_date) : undefined,
        endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
        propertyIds: body.data.property_ids,
        hostIds: body.data.host_ids,
      };

      const userId = request.auth!.sub;
      const role = request.auth!.role;

      if (role === 'host') {
        filters.hostIds = [userId];
      }

      const metrics = await OccupancyAnalyticsEngine.calculate(filters);
      return reply.send({ data: metrics });
    }
  );

  app.get(
    '/analytics/attribution',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const body = dateSchema.safeParse(request.query);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid query' });
      }

      const filters = {
        startDate: body.data.start_date ? new Date(body.data.start_date) : undefined,
        endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
        propertyIds: body.data.property_ids,
        hostIds: body.data.host_ids,
      };

      const metrics = await AttributionEngine.calculate(filters);
      return reply.send({ data: metrics });
    }
  );

  app.get(
    '/analytics/property-performance',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const body = dateSchema.safeParse(request.query);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid query' });
      }

      const userId = request.auth!.sub;
      const role = request.auth!.role;

      if (role === 'host') {
        const performance = await PropertyPerformanceEngine.calculateForHost(userId, {
          startDate: body.data.start_date ? new Date(body.data.start_date) : undefined,
          endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
        });
        return reply.send({ data: performance });
      } else {
        const performances = await PropertyPerformanceEngine.calculateAll({
          startDate: body.data.start_date ? new Date(body.data.start_date) : undefined,
          endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
        });
        return reply.send({ data: performances });
      }
    }
  );

  app.get(
    '/analytics/insights',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const userId = request.auth!.sub;
      const role = request.auth!.role;

      const insights = [];

      if (role === 'host') {
        const performance = await PropertyPerformanceEngine.calculateForHost(userId);
        
        const underperforming = performance.properties.filter(p => p.score < 50);
        if (underperforming.length > 0) {
          insights.push({
            type: 'underperforming',
            message: `${underperforming.length} propiedades con bajo rendimiento`,
            properties: underperforming.map(p => ({ id: p.propertyId, score: p.score })),
          });
        }

        const avgOccupancy = performance.properties.reduce((sum, p) => sum + p.metrics.occupancyRate, 0) / performance.properties.length;
        if (avgOccupancy < 50) {
          insights.push({
            type: 'low_occupancy',
            message: `Ocupación promedio baja: ${avgOccupancy.toFixed(1)}%`,
            recommendation: 'Considera ajustar precios o mejorar visibilidad',
          });
        }
      }

      return reply.send({ data: insights });
    }
  );
}
