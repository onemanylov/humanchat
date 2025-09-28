'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createScrollTracker, scrollToBottom } from '~/lib/chat/utils/scroll-utils';
import type { ChatMessage } from '~/lib/chat/types';

export type ChatUIState = {
  // Scroll management
  listRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  scrollDistance: number;
  scrollToBottom: () => void;
  
  // Loading states
  pillVisible: boolean;
  scrollPillLabel: string | null;
  
  // Actions
  onItemsChange: (count: number) => void;
  markLoadingMore: () => void;
};

export function useChatUI<T extends HTMLElement = HTMLDivElement>(): ChatUIState {
  const listRef = useRef<T>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [pillVisible, setPillVisible] = useState(false);
  const [scrollPillLabel, setScrollPillLabel] = useState<string | null>(null);
  const [, setIsLoadingMore] = useState(false);

  // Create scroll tracker
  const scrollTrackerRef = useRef(
    createScrollTracker((atBottom, distance) => {
      setIsAtBottom(atBottom);
      setScrollDistance(distance);
    })
  );

  // Handle scroll events
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleScroll = () => {
      scrollTrackerRef.current.handleScroll(element);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when new items are added
  const onItemsChange = useCallback(() => {
    const element = listRef.current;
    if (!element) return;

    // Auto-scroll if user is at bottom
    if (isAtBottom && !scrollTrackerRef.current.getUserScrolledUp()) {
      setTimeout(() => {
        scrollToBottom(element, 'smooth');
      }, 50);
    }
  }, [isAtBottom]);

  // Handle loading states
  const markLoadingMore = useCallback(() => {
    setIsLoadingMore(true);
    setPillVisible(true);
    setScrollPillLabel('Loading more messages...');
    
    // Clear loading state after a delay
    setTimeout(() => {
      setIsLoadingMore(false);
      setPillVisible(false);
      setScrollPillLabel(null);
    }, 2000);
  }, []);

  // Scroll to bottom function
  const handleScrollToBottom = useCallback(() => {
    const element = listRef.current;
    if (element) {
      scrollToBottom(element, 'smooth');
      scrollTrackerRef.current.resetUserScroll();
    }
  }, []);

  return {
    listRef: listRef as React.RefObject<HTMLDivElement>,
    isAtBottom,
    scrollDistance,
    scrollToBottom: handleScrollToBottom,
    pillVisible,
    scrollPillLabel,
    onItemsChange,
    markLoadingMore,
  };
}

/**
 * Hook for counting new messages when user is not at bottom
 */
export function useNewMessagesCounter(
  messages: ChatMessage[],
  isAtBottom: boolean,
  scrollDistance: number,
): number {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const currentCount = messages.length;
    const previousCount = lastMessageCountRef.current;
    
    if (currentCount > previousCount && !isAtBottom && scrollDistance > 100) {
      // New messages arrived while user is scrolled up
      setUnreadCount(prev => prev + (currentCount - previousCount));
    } else if (isAtBottom) {
      // User scrolled to bottom, reset counter
      setUnreadCount(0);
    }
    
    lastMessageCountRef.current = currentCount;
  }, [messages.length, isAtBottom, scrollDistance]);

  return unreadCount;
}