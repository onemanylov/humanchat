'use client';

import { useEffect } from 'react';
import { useChat } from '~/providers/ChatProvider';
import { useChatUI, useNewMessagesCounter } from '~/hooks/chat/useChatUI';
import { ChatMessageList } from './ChatMessageList';
import { ChatLoadMoreButton } from '../ui/ChatLoadMoreButton';
import { ChatScrollToBottom } from '../ui/ChatScrollToBottom';
import { ChatLoadingIndicator } from '../ui/ChatLoadingIndicator';

export type ChatMessagesProps = {
  className?: string;
};

export function ChatMessages({ className }: ChatMessagesProps) {
  const { 
    messages, 
    isInitialLoading, 
    isLoadingMore, 
    hasMoreMessages, 
    loadOlderMessages, 
    currentUser 
  } = useChat();

  const {
    listRef,
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
    pillVisible,
    scrollPillLabel,
    isAtBottom,
    scrollDistance,
  } = useChatUI<HTMLDivElement>();

  const unreadCount = useNewMessagesCounter(messages, isAtBottom, scrollDistance);

  // Track loading state
  useEffect(() => {
    if (isLoadingMore) markLoadingMore();
  }, [isLoadingMore, markLoadingMore]);

  // Track message count changes
  useEffect(() => {
    onItemsChange();
  }, [messages.length, onItemsChange]);

  if (isInitialLoading) {
    return <ChatLoadingIndicator isVisible={true} className={className} />;
  }

  return (
    <div className={`relative flex h-full w-full flex-col overflow-hidden px-2 ${className || ''}`}>
      {/* Loading pill */}
      <div className="pointer-events-none fixed top-14 left-1/2 z-10 flex -translate-x-1/2 justify-center">
        {pillVisible && scrollPillLabel && (
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] whitespace-nowrap text-white/80 backdrop-blur">
            {scrollPillLabel}
          </div>
        )}
      </div>

      {/* Messages container */}
      <div
        ref={listRef}
        className="h-full w-full flex flex-col gap-2 overflow-y-auto py-2 pr-0"
      >
        <ChatLoadMoreButton
          onLoadMore={loadOlderMessages}
          isLoading={isLoadingMore}
          hasMore={hasMoreMessages}
        />
        
        <ChatMessageList
          messages={messages}
          currentWallet={currentUser?.wallet}
        />
      </div>

      {/* Scroll to bottom button */}
      <ChatScrollToBottom
        onScrollToBottom={scrollToBottom}
        unreadCount={unreadCount}
        isVisible={!isAtBottom}
      />
    </div>
  );
}