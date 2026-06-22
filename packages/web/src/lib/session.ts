'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny localStorage-backed session store for JWT sessions (staff/owner/admin).
 * SSR-safe: returns null until the client mounts, so server and first client
 * render agree and there's no hydration mismatch.
 */
function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function useSession<T>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(read<T>(key));
    setReady(true);
  }, [key]);

  const set = useCallback(
    (v: T) => {
      window.localStorage.setItem(key, JSON.stringify(v));
      setValue(v);
    },
    [key],
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(key);
    setValue(null);
  }, [key]);

  return { value, set, clear, ready };
}
