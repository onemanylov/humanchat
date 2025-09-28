'use client';

import { useChatConnection } from '~/lib/chat/connection';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { trpc } from '~/trpc/react';
import { useRateLimit } from '~/hooks';

export default function Chat() {
  const { rateLimit, setRateLimit, remainingSeconds } = useRateLimit();
  const connection = useChatConnection({
    onRateLimit: (event) => setRateLimit(event),
  });

  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1_000 * 30,
    refetchOnWindowFocus: false,
  });

  const currentUser = meQuery.data?.user ?? null;

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {connection.isInitialLoading ? (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
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

        <ChatInput
          socket={connection.socket}
          currentUser={currentUser}
          disabled={connection.isInitialLoading || connection.isTokenLoading}
          isRateLimited={Boolean(rateLimit)}
          onSendOptimistic={connection.addMessage}
        />
      </div>

      {rateLimit && (
        <div className="absolute bottom-20 left-1/2 mx-auto mb-2 -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-50 px-4 py-1 text-xs whitespace-nowrap text-amber-700 shadow-sm">
          {rateLimit.message} Try again in {remainingSeconds}s.
        </div>
      )}
    </div>
  );
}
