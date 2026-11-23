import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRoles } from '../plugins/auth.js';
import { ApiErrorCode, apiErrorBody } from '../lib/api-errors.js';
import { idListSchema, resolveRange, type ScopeFilters } from '../lib/analytics/range.js';
import { RevenueAnalyticsEngine } from '../lib/analytics/revenue-engine.js';
import { OccupancyAnalyticsEngine } from '../lib/analytics/occupancy-engine.js';
import { AttributionEngine } from '../lib/analytics/attribution-engine.js';
import { PropertyPerformanceEngine } from '../lib/analytics/property-performance-engine.js';

const querySchema = z.object({
  start_date: z.string().max(40).optional(),
  end_date: z.string().max(40).optional(),
  property_ids: idListSchema,
  host_ids: idListSchema,
});

/**
 * Validates the shared query (YYYY-MM-DD dates, id lists) and applies role scoping.
 * Hosts are always pinned to their own account, whatever `host_ids` says; only admins may choose hosts.
 * Replies 400 itself and returns null when the query is invalid.
 */
function scopeFromRequest(request: FastifyRequest, reply: FastifyReply): ScopeFilters | null {
  const parsed = querySchema.safeParse(request.query);
  if (!parsed.success) {
    reply.status(400).send(apiErrorBody(ApiErrorCode.INVALID_QUERY));
    return null;
  }

  const resolved = resolveRange(parsed.data.start_date, parsed.data.end_date);
  if (!resolved.ok) {
    reply.status(400).send(apiErrorBody(ApiErrorCode.INVALID_QUERY, { message: resolved.message }));
    return null;
  }

  const { sub, role } = request.auth!;
  return {
    range: resolved.range,
    propertyIds: parsed.data.property_ids,
    hostIds: role === 'host' ? [sub] : parsed.data.host_ids,
  };
}

function periodOf(scope: ScopeFilters) {
  const { startDate, endDate, days } = scope.range;
  return { start_date: startDate, end_date: endDate, days };
}

export async function analyticsRoutes(app: FastifyInstance) {
  // Unexpected failures must not leak Prisma/driver details to the client.
  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode < 500) return reply.send(error);
    request.log.error({ err: error }, 'analytics request failed');
    return reply.status(500).send({
      error: 'No pudimos calcular las métricas ahora. Inténtalo de nuevo en unos minutos.',
      code: 'ANALYTICS_FAILED',
    });
  });

  app.get(
    '/analytics/revenue',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const scope = scopeFromRequest(request, reply);
      if (!scope) return reply;

      const metrics = await RevenueAnalyticsEngine.calculate(scope);
      return reply.send({ data: metrics, period: periodOf(scope) });
    }
  );

  app.get(
    '/analytics/occupancy',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const scope = scopeFromRequest(request, reply);
      if (!scope) return reply;

      const metrics = await OccupancyAnalyticsEngine.calculate(scope);
      return reply.send({ data: metrics, period: periodOf(scope) });
    }
  );

  app.get(
    '/analytics/attribution',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const scope = scopeFromRequest(request, reply);
      if (!scope) return reply;

      const metrics = await AttributionEngine.calculate(scope);
      return reply.send({ data: metrics, period: periodOf(scope) });
    }
  );

  app.get(
    '/analytics/property-performance',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const scope = scopeFromRequest(request, reply);
      if (!scope) return reply;

      if (request.auth!.role === 'host') {
        const performance = await PropertyPerformanceEngine.calculateForHost(request.auth!.sub, {
          range: scope.range,
        });
        return reply.send({ data: performance, period: periodOf(scope) });
      }

      const performances = await PropertyPerformanceEngine.calculateAll({ range: scope.range });
      return reply.send({ data: performances, period: periodOf(scope) });
    }
  );

  app.get(
    '/analytics/insights',
    { preHandler: [authenticate, requireRoles(['admin', 'host'])] },
    async (request, reply) => {
      const scope = scopeFromRequest(request, reply);
      if (!scope) return reply;

      const insights: Array<Record<string, unknown>> = [];

      if (request.auth!.role === 'host') {
        const performance = await PropertyPerformanceEngine.calculateForHost(request.auth!.sub, {
          range: scope.range,
        });

        if (performance.draftPropertiesCount > 0) {
          const count = performance.draftPropertiesCount;
          insights.push({
            type: 'pending_review',
            message:
              count === 1
                ? '1 propiedad en revisión: todavía no es visible para los huéspedes.'
                : `${count} propiedades en revisión: todavía no son visibles para los huéspedes.`,
            recommendation: 'Sube fotos de calidad: son lo primero que revisamos antes de publicarla.',
          });
        }

        // Drafts cannot take bookings yet, so only live properties are judged.
        const live = performance.properties;
        if (live.length > 0) {
          const underperforming = live.filter((p) => p.score < 50);
          if (underperforming.length > 0) {
            insights.push({
              type: 'underperforming',
              message:
                underperforming.length === 1
                  ? '1 propiedad con bajo rendimiento'
                  : `${underperforming.length} propiedades con bajo rendimiento`,
              properties: underperforming.map((p) => ({ id: p.propertyId, score: p.score })),
            });
          }

          const avgOccupancy = live.reduce((sum, p) => sum + p.metrics.occupancyRate, 0) / live.length;
          if (avgOccupancy < 50) {
            insights.push({
              type: 'low_occupancy',
              message: `Ocupación promedio baja: ${String(Math.round(avgOccupancy * 10) / 10).replace('.', ',')}%`,
              recommendation: 'Considera ajustar precios o mejorar visibilidad',
            });
          }
        }
      }

      return reply.send({ data: insights, period: periodOf(scope) });
    }
  );
}
