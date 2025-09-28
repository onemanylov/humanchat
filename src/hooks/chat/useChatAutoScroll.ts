import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useChatAutoScroll<T extends HTMLElement>() {
  const listRef = useRef<T | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [pillVisible, setPillVisible] = useState(false);
  const lastCountRef = useRef(0);
  const wasLoadingMoreRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const markLoadingMore = useCallback(() => {
    console.log('🔄 markLoadingMore called - setting wasLoadingMoreRef to true');
    wasLoadingMoreRef.current = true;
  }, []);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distance = Math.max(0, scrollHeight - (scrollTop + clientHeight));
      setScrollDistance(distance);
      const atBottom = distance < 80;
      const wasAtBottom = isAtBottom;
      setIsAtBottom(atBottom);
      if (atBottom) setShowScrollToLatest(false);
      lastScrollTopRef.current = scrollTop;
      setPillVisible(scrollTop > 24);
      
      if (wasAtBottom !== atBottom) {
        console.log('📍 isAtBottom changed:', { from: wasAtBottom, to: atBottom, distance, scrollTop, scrollHeight, clientHeight });
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
      const previousCount = lastCountRef.current;
      lastCountRef.current = numItems;

      console.log('📝 onItemsChange #' + (numItems - previousCount) + ':', { 
        numItems, 
        previousCount, 
        hasNew, 
        initial, 
        wasLoadingMore: wasLoadingMoreRef.current, 
        isAtBottom,
        callNumber: lastCountRef.current === 0 ? 1 : (numItems > previousCount ? Math.floor(Math.random() * 1000) : 0)
      });

      if (!hasNew) return;

      if (wasLoadingMoreRef.current) {
        console.log('Loading more - preserving scroll position');
        // Store current scroll position when loading more messages
        const currentScrollTop = element.scrollTop;
        const currentScrollHeight = element.scrollHeight;
        
        // Wait for DOM update then restore scroll position
        requestAnimationFrame(() => {
          const newScrollHeight = element.scrollHeight;
          const heightDifference = newScrollHeight - currentScrollHeight;
          console.log('Restoring scroll:', { currentScrollTop, heightDifference, newTop: currentScrollTop + heightDifference });
          element.scrollTo({
            top: currentScrollTop + heightDifference,
            behavior: 'auto',
          });
        });
        
        wasLoadingMoreRef.current = false;
        console.log('✅ Load more scroll position restored - exiting early');
        return;
      }

      if (initial || isAtBottom) {
        console.log('Auto-scrolling to bottom because:', { initial, isAtBottom });
        requestAnimationFrame(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: initial ? 'auto' : 'smooth',
          });
        });
        setShowScrollToLatest(false);
      } else {
        console.log('Not scrolling - user is not at bottom');
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

  const scrollPillLabel = useMemo(() => {
    // For now, we only support Today/Yesterday based on the latest message timestamps users pass
    // The parent can read this as needed; keep simple without DOM reads here
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    // If user has scrolled away from top area, show a generic label; real date grouping could be added later
    if (!pillVisible) return '';
    // Basic heuristic: if we've scrolled at all, show "Today"
    // A more advanced implementation would compute based on visible message date
    // but we avoid heavy observers here.
    return 'Today';
  }, [pillVisible]);

  return {
    listRef,
    isAtBottom,
    showScrollToLatest,
    pillVisible,
    scrollPillLabel,
    scrollDistance,
    scrollToBottom,
    onItemsChange,
    markLoadingMore,
  } as const;
}
