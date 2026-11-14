import Header from '@/components/Header';
import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <Header />
      <main id="contenido" className="wana-container py-8 lg:py-10">
        <div className="h-[42vh] animate-pulse rounded-[var(--elevari-radius-xl)] bg-elevari-sand" />
        <div className="mt-10">
          <Skeleton />
        </div>
      </main>
    </>
  );
}
