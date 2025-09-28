import { useCallback, useEffect, useRef, useState } from 'react';

export function useChatAutoScroll<T extends HTMLElement>() {
  const listRef = useRef<T | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastCountRef = useRef(0);
  const wasLoadingMoreRef = useRef(false);

  const markLoadingMore = useCallback(() => {
    wasLoadingMoreRef.current = true;
  }, []);

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

  const onItemsChange = useCallback(
    (numItems: number) => {
      const element = listRef.current;
      if (!element) return;

      const hasNew = numItems > lastCountRef.current;
      const initial = lastCountRef.current === 0;
      lastCountRef.current = numItems;

      if (!hasNew) return;

      if (wasLoadingMoreRef.current) {
        wasLoadingMoreRef.current = false;
        return;
      }

      if (initial || isAtBottom) {
        requestAnimationFrame(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: initial ? 'auto' : 'smooth',
          });
        });
        setShowScrollToLatest(false);
      } else {
        setShowScrollToLatest(true);
      }
    },
    [isAtBottom],
  );

  const scrollToBottom = useCallback(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    setShowScrollToLatest(false);
  }, []);

  return {
    listRef,
    isAtBottom,
    showScrollToLatest,
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
  } as const;
}
