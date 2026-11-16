import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function HostAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <Suspense fallback={<div>Cargando...</div>}>
        <AnalyticsDashboard userRole="host" />
      </Suspense>
    </div>
  );
}
