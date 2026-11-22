import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  className?: string;
  height?: number;
  width?: number | string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  latitude,
  longitude,
  address,
  className = '',
  height = 300,
  width = '100%',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels.text',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: address || 'Property Location',
      });
    } catch (err) {
      setError('Failed to initialize map');
    }
  }, [isLoaded, latitude, longitude]);

  if (error) {
    return (
      <div
        className={`relative bg-slate-200 rounded-lg border border-slate-300 ${className}`}
        style={{ height, width }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
          {error}
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm opacity-50">
          📍 {address || 'Location not available'}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`relative bg-slate-100 rounded-lg border border-slate-200 ${className}`}
        style={{ height, width }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm animate-pulse">
          Loading map…
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height, width }}
    />
  );
};

export default GoogleMap;