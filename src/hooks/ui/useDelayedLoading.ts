import { useEffect, useMemo, useState } from 'react';

export function useDelayedLoading(busy: boolean, delayMs = 500) {
  const [show, setShow] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!completed && !busy) {
      const id = setTimeout(() => {
        setShow(false);
        setCompleted(true);
      }, delayMs);
      return () => clearTimeout(id);
    }
  }, [busy, completed, delayMs]);

  return { show, completed } as const;
}
