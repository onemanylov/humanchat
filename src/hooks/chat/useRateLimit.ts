import { useEffect, useMemo, useState } from 'react';
import type { RateLimitEvent } from '~/lib/chat/connection';

export function useRateLimit() {
  const [rateLimit, setRateLimit] = useState<RateLimitEvent | null>(null);

  useEffect(() => {
    if (!rateLimit) return;
    const timeout = rateLimit.retryAt - Date.now();
    if (timeout <= 0) {
      setRateLimit(null);
      return;
    }
    const id = setTimeout(() => setRateLimit(null), timeout);
    return () => clearTimeout(id);
  }, [rateLimit]);

  const remainingSeconds = useMemo(() => {
    if (!rateLimit) return 0;
    return Math.max(0, Math.ceil((rateLimit.retryAt - Date.now()) / 1000));
  }, [rateLimit]);

  return { rateLimit, setRateLimit, remainingSeconds } as const;
}
