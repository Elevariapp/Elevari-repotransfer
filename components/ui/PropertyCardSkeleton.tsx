export default function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="aspect-[4/3] rounded-2xl bg-elevari-sand" />
      <div className="mt-3 h-4 w-3/4 rounded-lg bg-elevari-sand" />
      <div className="mt-2 h-3 w-1/2 rounded-lg bg-elevari-sand/80" />
      <div className="mt-3 h-4 w-1/3 rounded-lg bg-elevari-sand" />
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
