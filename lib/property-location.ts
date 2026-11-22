/**
 * Texto de ubicación para propiedades Waná (Glamping Waná · Sutatausa / Cucunubá).
 */
export function formatPropertyLocation(city: string | null | undefined, country?: string) {
  if (!city) return country === 'CO' ? 'Colombia' : country ?? 'Colombia';

  const normalized = city.trim().toLowerCase();
  if (normalized === 'sutatausa') {
    return 'Sutatausa, Cucunubá · Cundinamarca';
  }
  if (normalized === 'cucunubá' || normalized === 'cucunuba') {
    return 'Cucunubá, Sutatausa · Cundinamarca';
  }

  return country && country !== 'CO' ? `${city}, ${country}` : `${city}, Colombia`;
}

export function propertyMapsUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  return 'https://www.google.com/maps/search/Glamping+Waná+Sutatausa+Cucunubá';
}

export function glampingWanaPhotoPath(file: string) {
  return `/properties/glamping-wana/${file}`;
}
