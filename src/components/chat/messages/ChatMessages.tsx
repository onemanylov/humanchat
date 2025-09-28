'use client';

import { useEffect } from 'react';
import { useChat } from '~/providers/ChatProvider';
import { useChatUI, useNewMessagesCounter } from '~/hooks/chat/useChatUI';
import { ChatMessageList } from './ChatMessageList';
import { ChatLoadMoreButton } from '../ui/ChatLoadMoreButton';
import { ChatScrollToBottom } from '../ui/ChatScrollToBottom';
import { ChatLoadingIndicator } from '../ui/ChatLoadingIndicator';
import { ProgressiveBlur } from '~/components/ui/progressive-blur';

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
    currentUser,
  } = useChat();

  const {
    listRef,
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
    isAtBottom,
    scrollDistance,
  } = useChatUI<HTMLDivElement>();

  const unreadCount = useNewMessagesCounter(
    messages,
    isAtBottom,
    scrollDistance,
  );

  // Track loading state
  useEffect(() => {
    if (isLoadingMore) markLoadingMore();
  }, [isLoadingMore, markLoadingMore]);

  // Track message count changes
  useEffect(() => {
    onItemsChange(messages.length);
  }, [messages.length, onItemsChange]);

  if (isInitialLoading) {
    return <ChatLoadingIndicator isVisible={true} className={className} />;
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden px-2 ${className || ''}`}
    >
      {/* Messages container */}
      <div
        ref={listRef}
        className="flex h-full w-full flex-col gap-2 overflow-y-auto py-2 pt-16 pr-0 pb-18"
      >
        <ChatLoadMoreButton
          onLoadMore={async () => {
            await loadOlderMessages();
          }}
          isLoading={isLoadingMore}
          hasMore={hasMoreMessages}
        />

        <ChatMessageList
          messages={messages}
          currentWallet={currentUser?.wallet}
        />
      </div>

      {/* Progressive blur at the top */}
      <ProgressiveBlur
        className="pointer-events-none fixed top-10 left-0 h-10 w-full"
        direction="top"
        blurIntensity={0.5}
        blurLayers={4}
      />

      {/* white gradient at top */}
      <div className="pointer-events-none fixed top-10 left-0 h-10 w-full bg-gradient-to-b from-white to-white/0"></div>

      {/* Progressive blur at the bottom */}
      <ProgressiveBlur
        className="pointer-events-none fixed bottom-0 left-0 h-16 w-full"
        direction="bottom"
        blurIntensity={2}
        blurLayers={4}
      />

      {/* Scroll to bottom button */}
      <ChatScrollToBottom
        onScrollToBottom={scrollToBottom}
        unreadCount={unreadCount}
        isVisible={!isAtBottom}
      />
    </div>
  );
}
