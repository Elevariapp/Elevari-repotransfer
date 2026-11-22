export type SearchState = {
  city?: string;
  guests?: number;
  check_in?: string;
  check_out?: string;
  sort?: string;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
};

const STORAGE_KEY = 'elevari_last_search';

export function saveLastSearch(state: SearchState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
}

export function getLastSearch(): SearchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastSearch() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
