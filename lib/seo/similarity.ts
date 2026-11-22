export function normalizeAmenity(amenity: string): string {
  const map: Record<string, string> = {
    wifi: 'wifi',
    'wi-fi': 'wifi',
    fogata: 'fogata',
    'vista panoramica': 'vista',
    'vista panorámica': 'vista',
    estacionamiento: 'estacionamiento',
  };
  const key = amenity.trim().toLowerCase();
  return map[key] ?? key;
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  fogata: 'Fogata',
  vista: 'Vista panorámica',
  estacionamiento: 'Estacionamiento',
};
