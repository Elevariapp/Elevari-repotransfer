export type FavoriteId = string;

const STORAGE_KEY = 'elevari_favorites';

export function getFavorites(): FavoriteId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFavorite(id: FavoriteId) {
  const favs = new Set(getFavorites());
  favs.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('elevari:favorite_added', { detail: { id } }));
  }
}

export function removeFavorite(id: FavoriteId) {
  const favs = new Set(getFavorites());
  favs.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('elevari:favorite_removed', { detail: { id } }));
  }
}

export function isFavorite(id: FavoriteId) {
  return getFavorites().includes(id);
}
