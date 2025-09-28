'use client';

import { useEffect } from 'react';

export default function ErudaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // if (process.env.NODE_ENV !== 'development') return;
    (async () => {
      const eruda = (await import('eruda')).default;
      const g = globalThis as unknown as { __eruda_inited?: boolean };
      if (!g.__eruda_inited) {
        eruda.init();
        g.__eruda_inited = true;
      }
    })();
  }, []);
  return <>{children}</>;
}
