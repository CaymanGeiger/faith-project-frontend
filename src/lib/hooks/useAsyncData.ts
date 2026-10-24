import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = [], refreshIntervalMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, []);

  const load = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setError(null);
    try {
      const nextData = await loader();
      if (mountedRef.current && requestVersion === requestVersionRef.current) {
        setData(nextData);
      }
    } catch (caught) {
      if (mountedRef.current && requestVersion === requestVersionRef.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to load');
      }
    } finally {
      if (mountedRef.current && requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Native stacks retain previous screens. Refresh when returning after another
  // screen saved progress, rather than showing the data from its first mount.
  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestVersionRef.current += 1; };
  }, [load]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void load(); });
    const poll = refreshIntervalMs > 0 ? setInterval(() => { if (AppState.currentState === 'active') void load(); }, refreshIntervalMs) : undefined;
    return () => { requestVersionRef.current += 1; subscription.remove(); clearInterval(poll); };
  }, [load, refreshIntervalMs]);

  return { data, loading, error, reload: load, setData };
}
