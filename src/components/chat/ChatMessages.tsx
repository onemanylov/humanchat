'use client';

import { useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ChatMessage } from '~/lib/chat/types';
import { ChatMessageRow } from './ChatMessage';
import { useChatAutoScroll } from '~/hooks';
import { useNewMessagesCounter } from '~/hooks/chat/useNewMessagesCounter';

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
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
    pillVisible,
    scrollPillLabel,
    isAtBottom,
    scrollDistance,
  } = useChatAutoScroll<HTMLDivElement>();

  useEffect(() => {
    if (isLoading) markLoadingMore();
  }, [isLoading, markLoadingMore]);

  useEffect(() => {
    onItemsChange(ordered.length);
  }, [ordered.length, onItemsChange]);

  const unreadCount = useNewMessagesCounter(
    ordered,
    isAtBottom,
    scrollDistance,
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-2">
      <div className="pointer-events-none fixed top-14 left-1/2 z-10 flex -translate-x-1/2 justify-center">
        {pillVisible && scrollPillLabel && (
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] whitespace-nowrap text-white/80 backdrop-blur">
            {scrollPillLabel}
          </div>
        )}
      </div>

      <div
        ref={listRef}
        className="h/full w/full flex flex-col gap-2 overflow-y-auto py-2 pr-0"
      >
        {hasMore && (
          <button
            onClick={() => {
              void onLoadMore();
            }}
            disabled={isLoading}
            className="border-border mx-auto rounded-full border px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load more messages'}
          </button>
        )}
        {ordered.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-[14px] text-white/60">
            Loading chat...
          </div>
        )}
        {ordered.map((message, index) => (
          <ChatMessageRow
            key={message.clientId ?? message.id}
            message={message}
            isOwn={
              currentWallet
                ? message.wallet?.toLowerCase() === currentWallet.toLowerCase()
                : false
            }
            previousMessage={index > 0 ? ordered[index - 1] : null}
          />
        ))}
      </div>

      {!isAtBottom && unreadCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="pointer-events-auto fixed right-4 bottom-24 z-10 flex items-center justify-center rounded-full border border-white/10 bg-black/70 shadow-lg backdrop-blur"
          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
          aria-label={'Scroll to bottom'}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80">
              <ChevronDown strokeWidth={2} className="h-5 w-5 text-white" />
            </div>
            <span
              className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-rose-500 px-1 text-[10px] font-medium text-white shadow"
              style={{ lineHeight: '18px' }}
            >
              {unreadCount}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
