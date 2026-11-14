import Header from '@/components/Header';
import { PropertyGridSkeleton } from '@/components/ui/PropertyCardSkeleton';

export default function PropertiesLoading() {
  return (
    <>
      <Header />
      <main id="contenido" className="pb-16">
        <div className="border-b border-elevari-border/60 bg-elevari-sand/25">
          <div className="wana-container py-10 lg:py-14">
            <div className="max-w-2xl animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-elevari-sand" />
              <div className="h-10 w-3/4 rounded-lg bg-elevari-sand" />
              <div className="h-4 w-full rounded bg-elevari-sand/80" />
            </div>
          </div>
        </div>
        <div className="wana-container py-10 lg:py-12">
          <PropertyGridSkeleton count={8} />
        </div>
      </main>
    </>
  );
}
