export type ViewedProperty = { id: string; slug: string; title: string; viewedAt: number };

const STORAGE_KEY = 'elevari_recently_viewed';
const MAX_ITEMS = 20;

export function getRecentlyViewed(): ViewedProperty[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(property: Omit<ViewedProperty, 'viewedAt'>) {
  const items = getRecentlyViewed().filter(p => p.id !== property.id);
  items.unshift({ ...property, viewedAt: Date.now() });
  const trimmed = items.slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('elevari:recently_viewed', { detail: { id: property.id } }));
  }
}
