import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { getApiErrorMessage } from './api';

type LoadMode = 'initial' | 'refresh' | 'silent';

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  // Full reload with the loading state (retry button).
  reload: () => void;
  // Pull-to-refresh.
  refresh: () => void;
}

// Loads data when the screen is first shown and reloads it silently every time the screen regains
// focus, so lists never show stale state after the user comes back from another screen. A silent
// failure keeps what is already on display. `fetcher` must be a stable function (module level).
export function useScreenResource<T>(fetcher: () => Promise<T>, errorMessage: string): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (mode: LoadMode) => {
      const requestId = ++latestRequest.current;
      if (mode === 'initial') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);

      try {
        const result = await fetcher();
        if (requestId !== latestRequest.current) return;
        hasLoaded.current = true;
        setData(result);
        setError('');
      } catch (err) {
        if (requestId !== latestRequest.current) return;
        if (mode !== 'silent') setError(getApiErrorMessage(err, errorMessage));
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetcher, errorMessage],
  );

  useFocusEffect(
    useCallback(() => {
      void load(hasLoaded.current ? 'silent' : 'initial');
    }, [load]),
  );

  const reload = useCallback(() => void load('initial'), [load]);
  const refresh = useCallback(() => void load('refresh'), [load]);

  return { data, loading, refreshing, error, reload, refresh };
}
