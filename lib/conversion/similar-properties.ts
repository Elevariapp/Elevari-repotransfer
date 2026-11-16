export type PropertySummary = {
  id: string;
  slug: string;
  title: string;
  city: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
};

export function findSimilar(current: PropertySummary, candidates: PropertySummary[], limit = 4): PropertySummary[] {
  const scored = candidates
    .filter(p => p.id !== current.id)
    .map(p => {
      let score = 0;
      if (p.city === current.city) score += 3;
      const amenityOverlap = p.amenities.filter(a => current.amenities.includes(a)).length;
      score += amenityOverlap * 2;
      const priceDiff = Math.abs(p.price_per_night - current.price_per_night) / Math.max(current.price_per_night, 1);
      if (priceDiff < 0.2) score += 2;
      else if (priceDiff < 0.5) score += 1;
      if (Math.abs(p.max_guests - current.max_guests) <= 1) score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.p);
  return scored;
}
