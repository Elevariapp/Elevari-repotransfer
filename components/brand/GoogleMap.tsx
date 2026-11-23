"use client";

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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Avoid loading the script multiple times
    if (scriptLoaded) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src^="https://maps.googleapis.com/maps/api/js?key=${apiKey}"]`
    );
    if (existingScript) {
      setScriptLoaded(true);
      setIsLoaded(true);
      return;
    }

    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setScriptLoaded(true);
        setIsLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Google Maps JavaScript API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [scriptLoaded]);

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

  // Static map fallback URL (no API key required for basic static map with watermark)
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=${Math.round(parseFloat(width as string) || 300)}x${height}&markers=color:amber%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;

  if (error) {
    return (
      <div
        className={`relative bg-slate-200 rounded-lg border border-slate-300 ${className}`}
        style={{ height, width }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm p-4">
          <p className="mb-2">{error}</p>
          <div className="flex items-center gap-2 text-slate-400 text-sm opacity-70">
            📍 {address || 'Location not available'}
          </div>
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
          Cargando mapa… / Loading map…
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