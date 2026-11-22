export const GLAMPING_WANA_SLUG = 'glamping-wana';

export const GLAMPING_WANA_PROPERTY = {
  slug: GLAMPING_WANA_SLUG,
  title: 'Glamping Waná',
  description:
    'Glamping Waná es un refugio exclusivo entre Sutatausa y Cucunubá, en el corazón de Cundinamarca. ' +
    'Domos y espacios diseñados para desconectar: naturaleza, confort, fogata bajo las estrellas y el silencio de la sabana. ' +
    'Ideal para escapadas desde Bogotá sin perder la sensación de estar lejos de todo.',
  pricePerNight: 280000,
  maxGuests: 4,
  city: 'Sutatausa',
  country: 'CO',
  latitude: 5.2472,
  longitude: -73.8522,
  amenities: ['wifi', 'fogata', 'vista', 'estacionamiento'],
};

const PHOTO_FILES: Array<{ file: string; contentType: string }> = [
  { file: '01-cover.jpeg', contentType: 'image/jpeg' },
  { file: '02.webp', contentType: 'image/webp' },
  { file: '03.webp', contentType: 'image/webp' },
  { file: '04.webp', contentType: 'image/webp' },
  { file: '05.webp', contentType: 'image/webp' },
  { file: '06.webp', contentType: 'image/webp' },
  { file: '07.jpg', contentType: 'image/jpeg' },
  { file: '08.jpg', contentType: 'image/jpeg' },
  { file: '09.jpg', contentType: 'image/jpeg' },
  { file: '10.jpg', contentType: 'image/jpeg' },
  { file: '11.jpg', contentType: 'image/jpeg' },
  { file: '12.jpg', contentType: 'image/jpeg' },
  { file: '13.jpg', contentType: 'image/jpeg' },
  { file: '14.jpg', contentType: 'image/jpeg' },
];

function photoPath(file: string) {
  return `/properties/glamping-wana/${file}`;
}

export function glampingWanaMediaSeedData() {
  return PHOTO_FILES.map((photo, index) => ({
    type: 'image' as const,
    url: photoPath(photo.file),
    thumbnailUrl: photoPath(photo.file),
    sortOrder: index,
    status: 'approved' as const,
    contentType: photo.contentType,
  }));
}
