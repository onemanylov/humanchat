'use client';

import { useEffect, useMemo } from 'react';
import type { ChatMessage } from '~/lib/chat/types';
import { ChatMessageRow } from './ChatMessage';
import { useChatAutoScroll } from '~/hooks';

export type ChatMessagesProps = {
  messages: ChatMessage[];
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  currentWallet: string | null | undefined;
};

export function ChatMessages({
  messages,
  onLoadMore,
  hasMore,
  isLoading,
  currentWallet,
}: ChatMessagesProps) {
  const ordered = useMemo(() => {
    return [...messages].sort((a, b) => a.ts - b.ts);
  }, [messages]);

  const {
    listRef,
    showScrollToLatest,
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
  } = useChatAutoScroll<HTMLDivElement>();

  useEffect(() => {
    if (isLoading) markLoadingMore();
  }, [isLoading, markLoadingMore]);

  useEffect(() => {
    onItemsChange(ordered.length);
  }, [ordered.length, onItemsChange]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div
        ref={listRef}
        className="h/full w/full flex flex-col gap-3 overflow-y-auto pr-0"
      >
        {hasMore && (
          <button
            onClick={() => {
              void onLoadMore();
            }}
            disabled={isLoading}
            className="border-border text-muted-foreground hover:bg-muted mx-auto rounded-full border px-4 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load previous messages'}
          </button>
        )}
        {ordered.length === 0 && (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            No messages yet — start the conversation!
          </div>
        )}
        {ordered.map((message) => (
          <ChatMessageRow
            key={message.clientId ?? message.id}
            message={message}
            isOwn={
              currentWallet
                ? message.wallet?.toLowerCase() === currentWallet.toLowerCase()
                : false
            }
          />
        ))}
      </div>
      {showScrollToLatest && (
        <button
          onClick={scrollToBottom}
          className="border-border bg-background text-foreground hover:bg-muted absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1 text-xs shadow-lg"
        >
          New messages • Tap to catch up
        </button>
      )}
    </div>
  );
}
