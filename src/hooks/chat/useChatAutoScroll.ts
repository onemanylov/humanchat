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
      setIsAtBottom(atBottom);
      if (atBottom) setShowScrollToLatest(false);
      lastScrollTopRef.current = scrollTop;
      setPillVisible(scrollTop > 24);
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
