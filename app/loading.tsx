import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="wana-container py-8 animate-fade-in">
      <div className="h-[50vh] rounded-[1.75rem] bg-elevari-sand animate-pulse" />
      <div className="mt-8">
        <Skeleton />
      </div>
    </div>
  );
}
