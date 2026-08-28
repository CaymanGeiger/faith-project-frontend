import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestVersionRef = useRef(0);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

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

  useEffect(() => {
    mountedRef.current = true;
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
