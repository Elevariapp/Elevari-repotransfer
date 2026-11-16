'use client';
import { useEffect, useState } from 'react';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/conversion/favorites';
import { track } from '@/lib/conversion/analytics';

export default function FavoriteButton({ id, label }: { id: string; label?: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(id));
  }, [id]);

  const toggle = () => {
    if (fav) {
      removeFavorite(id);
      setFav(false);
      track('favorite_removed', { property_id: id });
    } else {
      addFavorite(id);
      setFav(true);
      track('favorite_added', { property_id: id });
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={fav}
      className="rounded-lg border px-3 py-2 text-sm"
    >
      {fav ? 'Quitar favorito' : label || 'Guardar favorito'}
    </button>
  );
}
