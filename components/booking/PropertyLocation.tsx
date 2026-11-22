import Link from 'next/link';
import GoogleMap from '@/components/brand/GoogleMap';
import { formatPropertyLocation, propertyMapsUrl } from '@/lib/property-location';

type Props = {
  city: string | null | undefined;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
};

export default function PropertyLocation({ city, country, latitude, longitude, address }: Props) {
  const label = formatPropertyLocation(city, country);
  const mapsUrl = propertyMapsUrl(latitude, longitude);
  const hasCoords = latitude != null && longitude != null;

  return (
    <section className="border-t border-elevari-border pt-8">
      <h2 className="elevari-section-title">Ubicación</h2>
      <p className="mt-3 text-elevari-muted leading-relaxed">
        Glamping Waná está en la zona rural entre{' '}
        <strong className="text-elevari-slate">Sutatausa</strong> y{' '}
        <strong className="text-elevari-slate">Cucunubá</strong>, en Cundinamarca — paisaje de
        sabana, silencio y cielo abierto, a poca distancia de Bogotá.
      </p>

      {hasCoords && (
        <div className="mt-6">
          <GoogleMap
            latitude={latitude!}
            longitude={longitude!}
            address={address || label}
            height={320}
            className="w-full"
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-elevari-border bg-elevari-ivory px-4 py-2 text-sm text-elevari-slate">
          <span className="text-elevari-amber" aria-hidden>◎</span>
          {label}
        </span>
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-elevari-forest hover:text-elevari-forest-deep transition"
        >
          Ver en Google Maps →
        </Link>
      </div>
    </section>
  );
}
