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
  
  // Actions
  onItemsChange: (count: number) => void;
  markLoadingMore: () => void;
};

export function useChatUI<T extends HTMLElement = HTMLDivElement>(): ChatUIState {
  const listRef = useRef<T>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [scrollDistance, setScrollDistance] = useState(0);
  const wasLoadingMoreRef = useRef(false);
  const scrollPositionRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const hasInitiallyScrolledRef = useRef(false);

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

    // Handle scroll position restoration after loading more messages
    if (wasLoadingMoreRef.current && scrollPositionRef.current) {
      console.log('📍 Restoring scroll position after load more');
      const { scrollTop: previousScrollTop, scrollHeight: previousScrollHeight } = scrollPositionRef.current;
      
      // Wait for DOM to update then restore position
      requestAnimationFrame(() => {
        const newScrollHeight = element.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight;
        const newScrollTop = previousScrollTop + heightDifference;
        
        console.log('Restoring scroll:', { 
          previousScrollTop, 
          previousScrollHeight, 
          newScrollHeight, 
          heightDifference, 
          newScrollTop 
        });
        
        element.scrollTo({
          top: newScrollTop,
          behavior: 'auto', // Instant, no animation
        });
      });
      
      // Clear refs after restoration
      wasLoadingMoreRef.current = false;
      scrollPositionRef.current = null;
      return;
    }

    // Auto-scroll if user is at bottom
    if (isAtBottom && !scrollTrackerRef.current.getUserScrolledUp()) {
      const isInitialScroll = !hasInitiallyScrolledRef.current;
      const behavior = isInitialScroll ? 'auto' : 'smooth';
      
      console.log('⬇️ Auto-scrolling to bottom via useChatUI', { isInitialScroll, behavior });
      
      setTimeout(() => {
        scrollToBottom(element, behavior);
        hasInitiallyScrolledRef.current = true;
      }, 50);
    }
  }, [isAtBottom]);

  // Handle loading states
  const markLoadingMore = useCallback(() => {
    console.log('🔄 markLoadingMore called in useChatUI');
    const element = listRef.current;
    
    if (element) {
      // Capture current scroll position before loading more
      scrollPositionRef.current = {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
      };
      console.log('💾 Captured scroll position:', scrollPositionRef.current);
    }
    
    wasLoadingMoreRef.current = true;
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
    listRef: listRef as unknown as React.RefObject<HTMLDivElement>,
    isAtBottom,
    scrollDistance,
    scrollToBottom: handleScrollToBottom,
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