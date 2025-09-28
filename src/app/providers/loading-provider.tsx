'use client';

import { useMemo } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useDelayedLoading } from '~/hooks';

export default function FullPageLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const busy = useMemo(
    () => isFetching + isMutating > 0,
    [isFetching, isMutating],
  );
  const { show } = useDelayedLoading(busy, 500);

  return (
    <>
      {show && (
        <div className="bg-background text-foreground fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="border-foreground/20 border-t-foreground h-10 w-10 animate-spin rounded-full border-2" />
        </div>
      )}
      {children}
    </>
  );
}
