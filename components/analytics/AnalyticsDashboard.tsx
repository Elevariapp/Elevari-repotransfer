"use client";

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { getToken } from '@/lib/auth-session';

interface Metrics {
  revenue?: any;
  occupancy?: any;
  performance?: any;
  insights?: any;
}

export function AnalyticsDashboard({ userRole }: { userRole: 'host' | 'admin' }) {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      
      const [revenueRes, occupancyRes, performanceRes, insightsRes] = await Promise.all([
        fetch(`/api/v1/analytics/revenue?${params}`, { headers }).then(r => r.json()),
        fetch(`/api/v1/analytics/occupancy?${params}`, { headers }).then(r => r.json()),
        fetch(`/api/v1/analytics/property-performance?${params}`, { headers }).then(r => r.json()),
        fetch(`/api/v1/analytics/insights`, { headers }).then(r => r.json()),
      ]);

      setMetrics({
        revenue: revenueRes.data,
        occupancy: occupancyRes.data,
        performance: performanceRes.data,
        insights: insightsRes.data,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">Fecha inicio</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Fecha fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={loadMetrics}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm font-medium mb-2">Ingresos Netos</div>
          <div className="text-2xl font-bold">
            ${metrics.revenue?.netRevenue?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-500">
            {metrics.revenue?.bookingsCount || 0} reservas
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium mb-2">Ocupación</div>
          <div className="text-2xl font-bold">
            {metrics.occupancy?.occupancyRate?.toFixed(1) || '0'}%
          </div>
          <div className="text-sm text-gray-500">
            {metrics.occupancy?.nightsBooked || 0} noches
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium mb-2">ADR</div>
          <div className="text-2xl font-bold">
            ${metrics.revenue?.adr?.toFixed(0) || '0'}
          </div>
          <div className="text-sm text-gray-500">Precio promedio</div>
        </Card>

        <Card>
          <div className="text-sm font-medium mb-2">RevPAR</div>
          <div className="text-2xl font-bold">
            ${metrics.revenue?.revpar?.toFixed(0) || '0'}
          </div>
          <div className="text-sm text-gray-500">Ingreso por habitación</div>
        </Card>
      </div>

      {userRole === 'host' && metrics.performance && (
        <Card>
          <div className="text-lg font-semibold mb-4">Performance de Propiedades</div>
          <div className="space-y-2">
            {metrics.performance.properties?.map((prop: any) => (
              <div key={prop.propertyId} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{prop.propertyTitle}</div>
                  <div className="text-sm text-gray-500">
                    Ocupación: {prop.metrics.occupancyRate.toFixed(1)}% | ADR: ${prop.metrics.adr.toFixed(0)}
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {prop.score.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {metrics.insights?.data && (
        <Card>
          <div className="text-lg font-semibold mb-4">Insights</div>
          <div className="space-y-2">
            {metrics.insights.data.map((insight: any, idx: number) => (
              <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-medium">{insight.message}</div>
                {insight.recommendation && (
                  <div className="text-sm text-gray-600 mt-1">{insight.recommendation}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
