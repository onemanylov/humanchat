'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage } from '~/lib/chat/types';
import { ChatMessageRow } from './ChatMessage';

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

  const listRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastCountRef = useRef(0);
  const wasLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      wasLoadingMoreRef.current = true;
    }
  }, [isLoading]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distance = scrollHeight - (scrollTop + clientHeight);
      const atBottom = distance < 80;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setShowScrollToLatest(false);
      }
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const hasNewMessages = ordered.length > lastCountRef.current;
    const initialLoad = lastCountRef.current === 0;
    lastCountRef.current = ordered.length;

    if (!hasNewMessages) return;

    if (wasLoadingMoreRef.current) {
      wasLoadingMoreRef.current = false;
      return;
    }

    if (initialLoad || isAtBottom) {
      requestAnimationFrame(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: initialLoad ? 'auto' : 'smooth',
        });
      });
      setShowScrollToLatest(false);
    } else {
      setShowScrollToLatest(true);
    }
  }, [ordered, isAtBottom]);

  const scrollToBottom = () => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    setShowScrollToLatest(false);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div
        ref={listRef}
        className="flex h/full w/full flex-col gap-3 overflow-y-auto pr-0"
      >
        {hasMore && (
          <button
            onClick={() => {
              void onLoadMore();
            }}
            disabled={isLoading}
            className="mx-auto rounded-full border border-white/10 px-4 py-1 text-xs text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load previous messages'}
          </button>
        )}
        {ordered.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-sm text-white/60">
            No messages yet — start the conversation!
          </div>
        )}
        {ordered.map((message) => (
          <ChatMessageRow
            key={message.clientId ?? message.id}
            message={message}
            isOwn={currentWallet ? message.wallet?.toLowerCase() === currentWallet.toLowerCase() : false}
          />
        ))}
      </div>
      {showScrollToLatest && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-1 text-xs text-white shadow-lg backdrop-blur hover:bg-white/10"
        >
          New messages • Tap to catch up
        </button>
      )}
    </div>
  );
}
