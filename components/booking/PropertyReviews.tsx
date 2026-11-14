type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
};

export default function PropertyReviews({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: Review[];
  rating: number | null;
  reviewCount: number;
}) {
  if (reviewCount === 0 && reviews.length === 0) return null;

  return (
    <section className="border-t border-elevari-border pt-8">
      <div className="flex items-center gap-2">
        <span className="text-elevari-forest text-xl">★</span>
        <h2 className="wana-section-title">
          {rating != null ? `${rating}` : '—'}
          <span className="font-normal text-elevari-muted"> · {reviewCount} reseñas</span>
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 4).map((review) => (
          <div key={review.id} className="rounded-2xl border border-elevari-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-elevari-slate">Huésped verificado</span>
              <span className="text-elevari-forest">★ {review.rating}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-elevari-slate line-clamp-4">
              {review.comment ?? 'Sin comentario.'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
