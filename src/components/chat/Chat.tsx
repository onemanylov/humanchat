'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChatConnection, type RateLimitEvent } from '~/lib/chat/connection';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { trpc } from '~/trpc/react';

export default function Chat() {
  const [rateLimit, setRateLimit] = useState<RateLimitEvent | null>(null);

  const connection = useChatConnection({
    onRateLimit: (event) => setRateLimit(event),
  });

  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1_000 * 30,
    refetchOnWindowFocus: false,
  });

  const currentUser = meQuery.data?.user ?? null;

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

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden pb-24">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {connection.isInitialLoading ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
            Loading messages…
          </div>
        ) : (
          <ChatMessages
            messages={connection.messages}
            onLoadMore={connection.loadOlderMessages}
            hasMore={connection.hasMoreMessages}
            isLoading={connection.isLoadingMore}
            currentWallet={currentUser?.wallet ?? null}
          />
        )}
      </div>

      {rateLimit && (
        <div className="mx-auto mb-2 rounded-full bg-amber-500/15 px-4 py-1 text-xs text-amber-200">
          {rateLimit.message} Try again in {remainingSeconds}s.
        </div>
      )}

      <div className="fixed right-0 bottom-0 left-0 border-t border-white/10 bg-[#05060a] p-4">
        <ChatInput
          socket={connection.socket}
          currentUser={currentUser}
          disabled={connection.isInitialLoading || connection.isTokenLoading}
          isRateLimited={Boolean(rateLimit)}
          onSendOptimistic={connection.addMessage}
        />
      </div>
    </div>
  );
}
